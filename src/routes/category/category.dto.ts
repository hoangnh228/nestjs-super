import { createZodDto } from 'nestjs-zod'
import {
  CreateCategoryBodySchema,
  GetAllCategoriesQuerySchema,
  GetAllCategoriesResSchema,
  GetCategoryDetailResSchema,
  GetCategoryParamsSchema,
  UpdateCategoryBodySchema,
} from 'src/routes/category/category.model'

export class GetAllCategoriesResDto extends createZodDto(GetAllCategoriesResSchema) {}
export class GetAllCategoriesQueryDto extends createZodDto(GetAllCategoriesQuerySchema) {}
export class GetCategoryDetailResDto extends createZodDto(GetCategoryDetailResSchema) {}
export class GetCategoryParamsDto extends createZodDto(GetCategoryParamsSchema) {}
export class CreateCategoryBodyDto extends createZodDto(CreateCategoryBodySchema) {}
export class UpdateCategoryBodyDto extends createZodDto(UpdateCategoryBodySchema) {}
