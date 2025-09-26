import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RolesService } from './roles.service'
import { AuthController } from 'src/routes/auth/auth.controller'
import { AuthRepository } from 'src/routes/auth/au.repo'

@Module({
  providers: [AuthService, RolesService, AuthRepository],
  controllers: [AuthController],
})
export class AuthModule {}
