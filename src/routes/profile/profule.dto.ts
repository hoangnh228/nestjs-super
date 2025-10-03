import { createZodDto } from 'nestjs-zod'
import { ChangePasswordBodySchema, UpdateMeBodySchema } from 'src/routes/profile/profile.model'

export class UpdateMeBodyDto extends createZodDto(UpdateMeBodySchema) {}
export class ChangePasswordBodyDto extends createZodDto(ChangePasswordBodySchema) {}
