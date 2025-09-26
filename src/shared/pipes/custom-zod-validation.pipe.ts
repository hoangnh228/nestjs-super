import { PipeTransform, UnprocessableEntityException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'
import { ZodError } from 'zod'

const CustomZodValidationPipe = createZodValidationPipe({
  // provide custom validation exception factory
  createValidationException: (error: ZodError) =>
    new UnprocessableEntityException(
      error.issues.map((err) => {
        return {
          ...err,
          path: err.path.join('.'),
        }
      }),
    ),
}) as new (...args: any[]) => PipeTransform

export default CustomZodValidationPipe
