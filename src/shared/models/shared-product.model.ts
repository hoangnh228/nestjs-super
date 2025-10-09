import z from 'zod'

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

export type ProductType = z.infer<typeof ProductSchema>
export type VariantsType = z.infer<typeof VariantsSchema>
