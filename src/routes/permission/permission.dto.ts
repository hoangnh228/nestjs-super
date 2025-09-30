import { createZodDto } from 'nestjs-zod'
import {
  CreatePermissionBodySchema,
  GetPermissionDetailResSchema,
  GetPermissionParamsSchema,
  GetPermissionQuerySchema,
  GetPermissionsResSchema,
  UpdatePermissionBodySchema,
} from 'src/routes/permission/permission.model'

export class GetPermissionsResDto extends createZodDto(GetPermissionsResSchema) {}

export class GetPermissionQueryDto extends createZodDto(GetPermissionQuerySchema) {}

export class GetPermissionParamsDto extends createZodDto(GetPermissionParamsSchema) {}

export class GetPermissionDetailResDto extends createZodDto(GetPermissionDetailResSchema) {}

export class CreatePermissionBodyDto extends createZodDto(CreatePermissionBodySchema) {}

export class UpdatePermissionBodyDto extends createZodDto(UpdatePermissionBodySchema) {}
