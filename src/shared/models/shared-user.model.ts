import { UserStatus } from 'src/shared/constants/auth.constant'
import z from 'zod'
import { RoleSchema } from './shared-role.model'
import { PermissionSchema } from './shared-permission.model'

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(50),
  password: z.string().min(6).max(50),
  phoneNumber: z.string().min(8).max(15),
  avatar: z.string().nullable(),
  totpSecret: z.string().nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

export const GetUserProfileResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
}).extend({
  role: RoleSchema.pick({ id: true, name: true }).extend({
    permissions: z.array(PermissionSchema.pick({ id: true, name: true, module: true, path: true, method: true })),
  }),
})

export const UpdateProfileResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
})

export type UserType = z.infer<typeof UserSchema>
export type GetUserProfileResType = z.infer<typeof GetUserProfileResSchema>
export type UpdateProfileResType = z.infer<typeof UpdateProfileResSchema>
