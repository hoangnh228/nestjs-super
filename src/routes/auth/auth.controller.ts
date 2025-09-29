import { Body, Controller, Post, Req } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { LoginBodyDto, RegisterBodyDto, RegisterResponseDto, SendOtpBodyDto } from 'src/routes/auth/auth.dto'
import { AuthService } from 'src/routes/auth/auth.service'
import { Ip } from 'src/shared/decorators/ip.decorator'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodSerializerDto(RegisterResponseDto)
  async register(@Body() body: RegisterBodyDto) {
    return this.authService.register(body)
  }

  @Post('otp')
  sendOtp(@Body() body: SendOtpBodyDto) {
    return this.authService.sendOtp(body)
  }

  @Post('login')
  async login(@Body() body: LoginBodyDto, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({ ...body, userAgent, ip })
  }

  // @Post('refresh-token')
  // async refreshToken(@Body() body: any) {
  //   return this.authService.refreshToken(body)
  // }

  // @Post('logout')
  // async logout(@Body() body: any) {
  //   return this.authService.logout(body)
  // }
}
