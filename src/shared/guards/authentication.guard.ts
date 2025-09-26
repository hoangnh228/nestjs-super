import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { AUTH_TYPE_KEY, AuthTypeDecoratorPayload } from 'src/shared/decorators/auth.decorator'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { ApiKeyGuard } from 'src/shared/guards/api-key.guard'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>

  constructor(
    private reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthTypes.Bearer]: this.accessTokenGuard,
      [AuthTypes.ApiKey]: this.apiKeyGuard,
      [AuthTypes.None]: { canActivate: () => true },
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.reflector.getAllAndOverride<AuthTypeDecoratorPayload | undefined>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || { authTypes: [AuthTypes.None], options: { condition: ConditionGuard.And } }

    const guards = authTypeValue.authTypes.map((authType) => this.authTypeGuardMap[authType])
    let error = new UnauthorizedException()

    if (authTypeValue.options.condition === ConditionGuard.Or) {
      for (const guard of guards) {
        const result = await Promise.resolve(guard.canActivate(context)).catch((err) => {
          error = err
          return false
        })

        if (result) {
          return true
        }
      }

      throw error
    } else {
      for (const guard of guards) {
        const result = await Promise.resolve(guard.canActivate(context)).catch((err) => {
          error = err
          return false
        })

        if (!result) {
          throw new UnauthorizedException()
        }
      }
    }

    return true
  }
}
