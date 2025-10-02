import { HTTP_METHODS } from 'src/shared/constants/role.constants'
import z from 'zod'

export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  module: z.string().max(500),
  path: z.string(),
  method: z.enum(HTTP_METHODS),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})
