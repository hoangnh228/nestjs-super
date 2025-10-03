import { createZodDto } from 'nestjs-zod'
import { GetUserProfileResSchema, UpdateProfileResSchema } from '../models/shared-user.model'

// apply for response of api GET /profile and GET users/:userId
export class GetUserProfileResDto extends createZodDto(GetUserProfileResSchema) {}

// apply for response of api PUT /profile and PUT users/:userId
export class UpdateProfileResDto extends createZodDto(UpdateProfileResSchema) {}
