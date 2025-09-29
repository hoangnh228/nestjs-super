import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const UserAgent = createParamDecorator((_, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest()
  return request.headers['user-agent'] as string
})
