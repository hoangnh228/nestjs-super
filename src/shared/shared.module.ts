import { Global, Module } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { ApiKeyGuard } from 'src/shared/guards/api-key.guard'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { APP_GUARD } from '@nestjs/core'
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'
import { EmailService } from 'src/shared/services/email.service'
import { TwoFactorAuthenticationService } from 'src/shared/services/2fa.service'

const sharedServices = [
  PrismaService,
  HashingService,
  TokenService,
  SharedUserRepository,
  SharedRoleRepository,
  EmailService,
  TwoFactorAuthenticationService,
]

@Global()
@Module({
  providers: [
    ...sharedServices,
    AccessTokenGuard,
    ApiKeyGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  exports: sharedServices,
  imports: [JwtModule],
})
export class SharedModule {}
