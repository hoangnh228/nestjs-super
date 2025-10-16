import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import type { Cache } from 'cache-manager'
import { Request } from 'express'
import { keyBy } from 'lodash'
import { REQUEST_ROLE_PERMISSIONS, REQUEST_USER_KEY } from 'src/shared/constants/auth.constant'
import { HTTP_METHODS } from 'src/shared/constants/role.constants'
import { RolePermissionsType } from 'src/shared/models/shared-role.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'

type Permission = RolePermissionsType['permissions'][number]
type CachedRole = RolePermissionsType & {
  permissions: {
    [key: string]: Permission
  }
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const decoded = await this.extractAndVerifyAccessToken(request)

    // check user permissions
    await this.validateUserPermissions(request, decoded)
    return true
  }

  private async extractAndVerifyAccessToken(request: Request): Promise<AccessTokenPayload> {
    const accessToken = this.extractAccessToken(request)
    try {
      const decoded = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decoded
      return decoded
    } catch {
      throw new UnauthorizedException('Invalid access token')
    }
  }

  private extractAccessToken(request: Request): string {
    const accessToken = request.headers.authorization?.split(' ')[1]
    if (!accessToken) {
      throw new UnauthorizedException('No access token provided')
    }
    return accessToken
  }

  private async validateUserPermissions(request: Request, decoded: AccessTokenPayload): Promise<void> {
    const roleId: number = decoded.roleId
    const path: string = request.route.path
    const method = request.method as keyof typeof HTTP_METHODS
    const cacheKey = `role:${roleId}`

    let cachedRole = await this.cacheManager.get<CachedRole>(cacheKey)
    if (!cachedRole) {
      const role = await this.prismaService.role
        .findUniqueOrThrow({
          where: {
            id: roleId,
            deletedAt: null,
          },
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        })
        .catch(() => {
          throw new ForbiddenException('You are not authorized to access this resource')
        })

      const permissionObject = keyBy(role.permissions, (p) => `${p.path}:${p.method}`) as CachedRole['permissions']
      cachedRole = { ...role, permissions: permissionObject }
      await this.cacheManager.set(cacheKey, cachedRole, 1000 * 60 * 60) // cache for 1 hour
      request[REQUEST_ROLE_PERMISSIONS] = role
    }

    const hasPermission: Permission | undefined = cachedRole?.permissions[`${path}:${method}`]
    if (!hasPermission) {
      throw new ForbiddenException('You are not authorized to access this resource')
    }
  }
}
