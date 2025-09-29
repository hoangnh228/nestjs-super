import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import requestIp from 'request-ip'

export const Ip = createParamDecorator((_, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest()
  return requestIp.getClientIp(request) as string
})
