import { createZodDto } from 'nestjs-zod'
import {
  CreateUserBodySchema,
  GetUserParamsSchema,
  GetUserQuerySchema,
  GetUsersResSchema,
  UpdateUserBodySchema,
} from './user.model'
import { UpdateProfileResDto } from '../../shared/dto/shared-user.dto'

export class GetUsersResDto extends createZodDto(GetUsersResSchema) {}

export class GetUsersQueryDto extends createZodDto(GetUserQuerySchema) {}

export class GetUserParamsDto extends createZodDto(GetUserParamsSchema) {}

export class CreateUserBodyDto extends createZodDto(CreateUserBodySchema) {}

export class UpdateUserBodyDto extends createZodDto(UpdateUserBodySchema) {}

export class CreateUserResDto extends UpdateProfileResDto {}
