import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RolesService } from './roles.service'
import { AuthController } from 'src/routes/auth/auth.controller'

@Module({
  providers: [AuthService, RolesService],
  controllers: [AuthController],
})
export class AuthModule {}
