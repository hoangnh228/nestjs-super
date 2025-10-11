import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { parse } from 'date-fns'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PREFIX_PAYMENT_CODE } from 'src/shared/constants/other.constant'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { MessageResType } from 'src/shared/models/response.model'
import { OrderIncludeProductSKUSnapshotType } from 'src/shared/models/shared-order.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class PaymentRepo {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paymentProducer: PaymentProducer,
  ) {}

  private getTotalPrice(orders: OrderIncludeProductSKUSnapshotType[]): number {
    return orders.reduce((total, order) => {
      const orderTotal = order.items.reduce((totalPrice, productSku) => {
        return totalPrice + productSku.skuPrice * productSku.quantity
      }, 0)
      return total + orderTotal
    }, 0)
  }

  async receiver(body: WebhookPaymentBodyType): Promise<MessageResType> {
    // 1. add payment transaction to db
    let amountIn = 0
    let amountOut = 0
    if (body.transferType === 'in') amountIn = body.transferAmount
    if (body.transferType === 'out') amountOut = body.transferAmount

    const paymentTransaction = await this.prismaService.paymentTransaction.findUnique({
      where: { id: body.id },
    })

    if (paymentTransaction) {
      throw new BadRequestException('Payment transaction already exists')
    }

    const paymentId = await this.prismaService.$transaction(async (tx) => {
      await tx.paymentTransaction.create({
        data: {
          gateway: body.gateway,
          transactionDate: parse(body.transactionDate, 'yyyy-MM-dd HH:mm:ss', new Date()),
          accountNumber: body.accountNumber,
          subAccount: body.subAccount,
          amountIn,
          amountOut,
          accumulated: body.accumulated,
          code: body.code,
          transactionContent: body.content,
          referenceNumber: body.referenceCode,
          body: body.description,
        },
      })

      // 2. check transaction message and total amount is match with order
      const paymentId = body.code
        ? Number(body.code.split(PREFIX_PAYMENT_CODE)[1])
        : Number(body.content?.split(PREFIX_PAYMENT_CODE)[1])

      if (isNaN(paymentId)) {
        throw new BadRequestException('Cannot find paymentId from code or content')
      }

      const payment = await tx.payment.findUnique({
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
        throw new NotFoundException('Payment not found')
      }

      const { orders } = payment
      const totalPrice = this.getTotalPrice(orders)

      if (totalPrice !== body.transferAmount) {
        throw new BadRequestException('Total amount is not match with order')
      }

      // 3. update payment status

      await Promise.all([
        tx.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.SUCCESS },
        }),
        tx.order.updateMany({
          where: { id: { in: orders.map((order) => order.id) } },
          data: { status: OrderStatus.PENDING_PICKUP },
        }),
        this.paymentProducer.removeJob(paymentId),
      ])

      return paymentId
    })

    return {
      message: `Payment transaction for paymentId: ${paymentId} processed successfully`,
    }
  }
}
