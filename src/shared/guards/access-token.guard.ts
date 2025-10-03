import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { Request } from 'express'
import { REQUEST_ROLE_PERMISSIONS, REQUEST_USER_KEY } from 'src/shared/constants/auth.constant'
import { HTTP_METHODS, HTTPMethodType } from 'src/shared/constants/role.constants'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
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
    const role = await this.prismaService.role
      .findUnique({
        where: { id: roleId, deletedAt: null },
        include: { permissions: { where: { deletedAt: null, path, method: method as HTTPMethodType } } },
      })
      .catch(() => {
        throw new ForbiddenException('You are not authorized to access this resource')
      })

    const hasPermission = role?.permissions.some(
      (permission) => permission.path === path && permission.method === method,
    )

    if (!hasPermission) {
      throw new ForbiddenException('You are not authorized to access this resource')
    }

    request[REQUEST_ROLE_PERMISSIONS] = role
  }
}
