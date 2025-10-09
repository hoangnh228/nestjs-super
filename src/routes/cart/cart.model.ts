import { ProductTranslationSchema } from 'src/shared/models/shared-product-translation.model'
import { ProductSchema } from 'src/shared/models/shared-product.model'
import { SKUSchema } from 'src/shared/models/shared-sku.model'
import { UserSchema } from 'src/shared/models/shared-user.model'
import z from 'zod'

export const CartItemSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive(),
  skuId: z.number(),
  userId: z.number(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const GetCartItemParamsSchema = z
  .object({
    cartItemId: z.coerce.number().int().positive(),
  })
  .strict()

export const CartItemDetailSchema = z.object({
  shop: UserSchema.pick({
    id: true,
    name: true,
    avatar: true,
  }),
  cartItems: z.array(
    CartItemSchema.extend({
      sku: SKUSchema.extend({
        product: ProductSchema.extend({
          productTranslations: z.array(
            ProductTranslationSchema.omit({
              createdById: true,
              updatedById: true,
              deletedById: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            }),
          ),
        }).omit({
          createdById: true,
          updatedById: true,
          deletedById: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        }),
      }).omit({
        createdById: true,
        updatedById: true,
        deletedById: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      }),
    }),
  ),
})

export const GetCartResSchema = z.object({
  data: z.array(CartItemDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const AddToCartBodySchema = CartItemSchema.pick({
  quantity: true,
  skuId: true,
}).strict()

export const UpdateCartItemBodySchema = AddToCartBodySchema

export const DeleteCartBodySchema = z
  .object({
    cartItemIds: z.array(z.number().int().positive()),
  })
  .strict()

export type CartItemType = z.infer<typeof CartItemSchema>
export type CartItemDetailType = z.infer<typeof CartItemDetailSchema>
export type GetCartItemParamsType = z.infer<typeof GetCartItemParamsSchema>
export type GetCartResType = z.infer<typeof GetCartResSchema>
export type AddToCartBodyType = z.infer<typeof AddToCartBodySchema>
export type UpdateCartItemBodyType = z.infer<typeof UpdateCartItemBodySchema>
export type DeleteCartBodyType = z.infer<typeof DeleteCartBodySchema>
