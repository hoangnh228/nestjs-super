import { PaginationQuerySchema } from 'src/shared/models/request.model'
import { OrderSchema, OrderStatusSchema, ProductSKUSnapshotSchema } from 'src/shared/models/shared-order.model'
import z from 'zod'

export const GetOrderListResSchema = z.object({
  data: z.array(
    OrderSchema.extend({
      items: z.array(ProductSKUSnapshotSchema),
    }).omit({
      receiver: true,
      deletedAt: true,
      deletedById: true,
      createdById: true,
      updatedById: true,
    }),
  ),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetOrderListQuerySchema = PaginationQuerySchema.extend({
  status: OrderStatusSchema.optional(),
})

export const GetOrderDetailResSchema = OrderSchema.extend({
  items: z.array(ProductSKUSnapshotSchema),
})

export const CreateOrderBodySchema = z
  .array(
    z.object({
      shopId: z.number(),
      receiver: z.object({
        name: z.string().min(1).max(255),
        phone: z.string().min(1).max(20),
        address: z.string().min(1).max(500),
      }),
      cartItemIds: z.array(z.number().min(1)),
    }),
  )
  .min(1)

export const CreateOrderResSchema = z.object({
  paymentId: z.number(),
  orders: z.array(OrderSchema),
})

export const CancelOrderResSchema = OrderSchema

export const CancelOrderBodySchema = z.object({})

export const GetOrderParamsSchema = z
  .object({
    orderId: z.coerce.number().int().positive(),
  })
  .strict()

export type GetOrderListResType = z.infer<typeof GetOrderListResSchema>
export type GetOrderListQueryType = z.infer<typeof GetOrderListQuerySchema>
export type GetOrderDetailResType = z.infer<typeof GetOrderDetailResSchema>
export type GetOrderParamsType = z.infer<typeof GetOrderParamsSchema>
export type CreateOrderBodyType = z.infer<typeof CreateOrderBodySchema>
export type CreateOrderResType = z.infer<typeof CreateOrderResSchema>
export type CancelOrderResType = z.infer<typeof CancelOrderResSchema>
