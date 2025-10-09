import {
  CancelOrderResType,
  CreateOrderBodyType,
  CreateOrderResType,
  GetOrderDetailResType,
  GetOrderListQueryType,
  GetOrderListResType,
} from 'src/routes/order/order.model'
import { PrismaService } from './../../shared/services/prisma.service'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { isNotFoundPrismaError } from 'src/shared/helpers'

@Injectable()
export class OrderRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(userId: number, query: GetOrderListQueryType): Promise<GetOrderListResType> {
    const { limit, page, status } = query
    const skip = (page - 1) * limit
    const take = limit
    const where: Prisma.OrderWhereInput = { userId, status }

    const totalItems$ = this.prismaService.order.count({ where })
    const data$ = this.prismaService.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })

    const [data, totalItems] = await Promise.all([data$, totalItems$])

    return {
      data: data,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  async create(userId: number, body: CreateOrderBodyType): Promise<CreateOrderResType> {
    const allBodyCartItemIds = body.flatMap((b) => b.cartItemIds)
    const cartItems = await this.prismaService.cartItem.findMany({
      where: { id: { in: allBodyCartItemIds }, userId },
      include: { sku: { include: { product: { include: { productTranslations: true } } } } },
    })

    // 1. validate cart items ids exist
    if (cartItems.length !== allBodyCartItemIds.length) {
      throw new NotFoundException('Some cart items not found')
    }

    // 2. validate stock for each sku
    const isOutOfStock = cartItems.some((item) => item.quantity > item.sku.stock)
    if (isOutOfStock) {
      throw new NotFoundException('Some cart items are out of stock')
    }

    // 3. check product is published
    const isSomeProductUnpublished = cartItems.some((item) => {
      const { product } = item.sku
      return product.deletedAt !== null || product.publishedAt === null || product.publishedAt > new Date()
    })
    if (isSomeProductUnpublished) {
      throw new NotFoundException('Some products are not available')
    }

    // 4. check skus in cart item belong to the same shop
    const cartItemsMap = new Map<number, (typeof cartItems)[0]>()
    cartItems.forEach((item) => cartItemsMap.set(item.id, item))
    const isValidShop = body.every((b) =>
      b.cartItemIds.every((cartItemId) => {
        const item = cartItemsMap.get(cartItemId)!
        return item.sku.createdById === b.shopId
      }),
    )
    if (!isValidShop) {
      throw new NotFoundException('Some cart items do not belong to the shop')
    }

    // 5. create order
    const orders = await this.prismaService.$transaction(async (tx) => {
      // Create payment first
      const payment = await tx.payment.create({
        data: { status: 'PENDING' },
      })

      const orders = await Promise.all(
        body.map((item) =>
          tx.order.create({
            data: {
              userId,
              status: OrderStatus.PENDING_PAYMENT,
              receiver: item.receiver,
              createdById: userId,
              shopId: item.shopId,
              paymentId: payment.id,
              items: {
                create: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemsMap.get(cartItemId)!
                  return {
                    productName: cartItem.sku.product.name,
                    skuPrice: cartItem.sku.price,
                    image: cartItem.sku.image,
                    skuId: cartItem.sku.id,
                    skuValue: cartItem.sku.value,
                    quantity: cartItem.quantity,
                    productId: cartItem.sku.product.id,
                    productTranslations: cartItem.sku.product.productTranslations.map((pt) => ({
                      id: pt.id,
                      name: pt.name,
                      description: pt.description,
                      languageId: pt.languageId,
                    })),
                  }
                }),
              },
              products: {
                connect: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemsMap.get(cartItemId)!
                  return { id: cartItem.sku.product.id }
                }),
              },
            },
          }),
        ),
      )

      // 6. delete cart items
      await tx.cartItem.deleteMany({ where: { id: { in: allBodyCartItemIds } } })

      return orders
    })

    return { data: orders }
  }

  async detail(userId: number, orderId: number): Promise<GetOrderDetailResType> {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId, userId, deletedAt: null },
      include: { items: true },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    return order
  }

  async cancel(userId: number, orderId: number): Promise<CancelOrderResType> {
    try {
      const order = await this.prismaService.order.findUniqueOrThrow({
        where: { id: orderId, userId, deletedAt: null },
      })

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new BadRequestException('Only orders with PENDING_PAYMENT status can be cancelled')
      }

      return this.prismaService.order.update({
        where: { id: orderId, userId, deletedAt: null },
        data: { status: OrderStatus.CANCELLED, updatedById: userId },
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Order not found')
      }
      throw error
    }
  }
}
