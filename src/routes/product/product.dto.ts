import { createZodDto } from 'nestjs-zod'
import {
  CreateProductBodySchema,
  GetProductDetailResSchema,
  GetProductParamsSchema,
  GetProductsQuerySchema,
  GetProductsResSchema,
  UpdateProductBodySchema,
} from 'src/routes/product/product.model'

export class GetProductsResDto extends createZodDto(GetProductsResSchema) {}
export class GetProductParamsDto extends createZodDto(GetProductParamsSchema) {}
export class GetProductsQueryDto extends createZodDto(GetProductsQuerySchema) {}
export class GetProductDetailResDto extends createZodDto(GetProductDetailResSchema) {}
export class CreateProductBodyDto extends createZodDto(CreateProductBodySchema) {}
export class UpdateProductBodyDto extends createZodDto(UpdateProductBodySchema) {}
