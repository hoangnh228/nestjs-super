import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { TokenService } from 'src/shared/services/token.service'
import env from 'src/shared/config'

@Injectable()
export class PaymentApiKeyGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const paymentApiKey = request.headers['payment-api-key']
    if (paymentApiKey !== env.PAYMENT_API_KEY) {
      throw new UnauthorizedException()
    }

    return true
  }
}
