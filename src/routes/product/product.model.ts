import { SKUSchema, UpsertSKUBodySchema } from 'src/routes/product/sku.model'
import { ProductTranslationSchema } from 'src/routes/product/product-translation/product-translation.model'
import { BrandIncludeTranslationSchema } from 'src/shared/models/shared-brand.model'
import { CategoryIncludeTranslationSchema } from 'src/shared/models/shared-category.model'
import z from 'zod'
import { OrderBy, SortBy } from 'src/shared/constants/other.constant'

function generateSKUs(variants: VariantsType) {
  if (variants.length === 0) return []

  let combinations = variants[0].options.map((option) => [option])

  for (let i = 1; i < variants.length; i++) {
    const current = variants[i]
    combinations = combinations.flatMap((prevCombo) => current.options.map((opt) => [...prevCombo, opt]))
  }

  return combinations.map((combo) => ({
    value: combo.join('-'),
    price: 0,
    stock: 100,
    image: '',
  }))
}

export const VariantSchema = z.object({
  value: z.string().trim(),
  options: z.array(z.string().trim()),
})

export const VariantsSchema = z.array(VariantSchema).superRefine((variants, ctx) => {
  // check variants and variant options are unique
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    const isExisting = variants.findIndex((v) => v.value.toLowerCase() === variant.value.toLowerCase()) !== i
    if (isExisting) {
      return ctx.addIssue({
        code: 'custom',
        message: `Variant name '${variant.value}' must be unique`,
        path: ['variants'],
      })
    }

    const isDifferentOptions = variant.options.some((option, index) => {
      return variant.options.findIndex((opt) => opt.toLowerCase() === option.toLowerCase()) !== index
    })
    if (isDifferentOptions) {
      return ctx.addIssue({
        code: 'custom',
        message: `Variant options in '${variant.value}' must be unique`,
        path: ['variants'],
      })
    }
  }
})

export const ProductSchema = z.object({
  id: z.number(),
  publishedAt: z.coerce.date().nullable(),
  name: z.string().trim().max(500),
  basePrice: z.number().min(0),
  virtualPrice: z.number().min(0),
  brandId: z.number().positive(),
  images: z.array(z.string()),
  variants: VariantsSchema,

  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

// for client and guest
export const GetProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  name: z.string().optional(),
  brandIds: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [Number(value)]
      }
      return value
    }, z.array(z.coerce.number().int().positive()))
    .optional(),
  categories: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [Number(value)]
      }
      return value
    }, z.array(z.coerce.number().int().positive()))
    .optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  createdById: z.coerce.number().int().positive().optional(),
  orderBy: z.enum([OrderBy.Asc, OrderBy.Desc]).default(OrderBy.Desc),
  sortBy: z.enum([SortBy.CreatedAt, SortBy.Price, SortBy.Sale]).default(SortBy.CreatedAt),
})

// for admin and sellers
export const GetManageProductsQuerySchema = GetProductsQuerySchema.extend({
  isPublic: z.preprocess((value) => value === 'true', z.boolean()).optional(),
  createdById: z.coerce.number().int().positive(),
})

export const GetProductsResSchema = z.object({
  data: z.array(ProductSchema.extend({ productTranslations: z.array(ProductTranslationSchema) })),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetProductParamsSchema = z
  .object({
    productId: z.coerce.number().int().positive(),
  })
  .strict()

export const GetProductDetailResSchema = ProductSchema.extend({
  productTranslations: z.array(ProductTranslationSchema),
  skus: z.array(SKUSchema),
  brand: BrandIncludeTranslationSchema,
  categories: z.array(CategoryIncludeTranslationSchema),
})

export const CreateProductBodySchema = ProductSchema.pick({
  publishedAt: true,
  name: true,
  basePrice: true,
  virtualPrice: true,
  brandId: true,
  images: true,
  variants: true,
})
  .extend({
    categories: z.array(z.coerce.number().int().positive()),
    skus: z.array(UpsertSKUBodySchema),
  })
  .strict()
  .superRefine(({ variants, skus }, ctx) => {
    // check number of SKUs valid
    const skuValueArray = generateSKUs(variants)
    if (skuValueArray.length !== skus.length) {
      return ctx.addIssue({
        code: 'custom',
        message: 'Number of SKUs must match the number of variant combinations',
        path: ['skus'],
      })
    }

    // check SKUs value valid
    let wrongSkuIndex = -1
    const isValidSKUs = skus.every((sku, index) => {
      const isValid = sku.value === skuValueArray[index].value
      if (!isValid) wrongSkuIndex = index
      return isValid
    })

    if (!isValidSKUs) {
      return ctx.addIssue({
        code: 'custom',
        message: `SKU value at index ${wrongSkuIndex} is invalid`,
        path: ['skus'],
      })
    }
  })

export const UpdateProductBodySchema = CreateProductBodySchema

export type ProductType = z.infer<typeof ProductSchema>
export type VariantsType = z.infer<typeof VariantsSchema>
export type GetProductsQueryType = z.infer<typeof GetProductsQuerySchema>
export type GetManageProductsQueryType = z.infer<typeof GetManageProductsQuerySchema>
export type GetProductsResType = z.infer<typeof GetProductsResSchema>
export type GetProductParamsType = z.infer<typeof GetProductParamsSchema>
export type GetProductDetailResType = z.infer<typeof GetProductDetailResSchema>
export type CreateProductBodyType = z.infer<typeof CreateProductBodySchema>
export type UpdateProductBodyType = z.infer<typeof UpdateProductBodySchema>
