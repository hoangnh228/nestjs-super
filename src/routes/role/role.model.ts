import z from 'zod'
import { PermissionSchema } from '../../shared/models/shared-permission.model'

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(500),
  description: z.string(),
  isActive: z.boolean().default(true),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const RoleWithPermissionsSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema),
})

export const GetRolesResSchema = z.object({
  data: z.array(RoleSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetRolesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  })
  .strict()

export const GetRoleParamsSchema = z
  .object({
    roleId: z.coerce.number(),
  })
  .strict()

export const GetRoleDetailResSchema = RoleWithPermissionsSchema

export const CreateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
}).strict()

export const CreateRoleResSchema = RoleSchema

export const UpdateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
})
  .extend({
    permissionIds: z.array(z.number()),
  })
  .strict()

export const UpdateRoleResSchema = RoleSchema

export type RolePermissionsType = z.infer<typeof RoleWithPermissionsSchema>
export type GetRolesResType = z.infer<typeof GetRolesResSchema>
export type GetRolesQueryType = z.infer<typeof GetRolesQuerySchema>
export type GetRoleDetailResType = z.infer<typeof GetRoleDetailResSchema>
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>
export type CreateRoleResType = z.infer<typeof CreateRoleResSchema>
export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>
export type GetRoleParamsType = z.infer<typeof GetRoleParamsSchema>
