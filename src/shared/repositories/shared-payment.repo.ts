import { Injectable } from '@nestjs/common'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedPaymentRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async cancelPaymentAndOrder(paymentId: number) {
    const payment = await this.prismaService.payment.findUnique({
      where: { id: paymentId },
      include: {
        orders: {
          include: {
            items: true,
          },
        },
      },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    const { orders } = payment
    const productSkuSnapshots = orders.flatMap((order) => order.items)
    await this.prismaService.$transaction(async (tx) => {
      const updateOrder$ = tx.order.updateMany({
        where: {
          id: { in: orders.map((order) => order.id) },
          status: OrderStatus.PENDING_PAYMENT,
          deletedAt: null,
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      })

      const updateSku$ = Promise.all(
        productSkuSnapshots
          .filter((item) => item.skuId)
          .map((item) => {
            return tx.sKU.update({
              where: { id: item.skuId as number },
              data: { stock: { increment: item.quantity } },
            })
          }),
      )

      const updatePayments$ = tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
        },
      })

      return await Promise.all([updateOrder$, updateSku$, updatePayments$])
    })
  }
}
