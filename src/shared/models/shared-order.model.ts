import { OrderStatus } from '@prisma/client'
import z from 'zod'

export const OrderStatusSchema = z.enum([
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PENDING_PICKUP,
  OrderStatus.PENDING_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.RETURNED,
  OrderStatus.CANCELLED,
])

export const OrderSchema = z.object({
  id: z.number(),
  userId: z.number(),
  status: OrderStatusSchema,
  receiver: z.object({
    name: z.string().min(1).max(255),
    phone: z.string().min(1).max(20),
    address: z.string().min(1).max(500),
  }),
  shopId: z.number().nullable(),
  paymentId: z.number(),

  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

export const ProductSKUSnapshotSchema = z.object({
  id: z.number(),
  productId: z.number().nullable(),
  productTranslations: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      description: z.string(),
      languageId: z.string(),
    }),
  ),
  skuPrice: z.number(),
  image: z.string(),
  skuValue: z.string(),
  skuId: z.number().nullable(),
  orderId: z.number().nullable(),
  quantity: z.number(),

  createdAt: z.date(),
})

export const OrderIncludeProductSKUSnapshotSchema = OrderSchema.extend({
  items: z.array(ProductSKUSnapshotSchema),
})

export type OrderType = z.infer<typeof OrderSchema>
export type OrderIncludeProductSKUSnapshotType = z.infer<typeof OrderIncludeProductSKUSnapshotSchema>
