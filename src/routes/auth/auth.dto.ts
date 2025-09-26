import { createZodDto } from 'nestjs-zod'
import { RegisterBodySchema, RegisterResSchema } from 'src/routes/auth/auth.model'

export class RegisterBodyDto extends createZodDto(RegisterBodySchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResSchema) {}
