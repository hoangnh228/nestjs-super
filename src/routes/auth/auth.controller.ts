import { Body, Controller, Post } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { RegisterBodyDto, RegisterResponseDto, SendOtpBodyDto } from 'src/routes/auth/auth.dto'
import { AuthService } from 'src/routes/auth/auth.service'

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

  // @Post('login')
  // async login(@Body() body: any) {
  //   return this.authService.login(body)
  // }

  // @Post('refresh-token')
  // async refreshToken(@Body() body: any) {
  //   return this.authService.refreshToken(body)
  // }

  // @Post('logout')
  // async logout(@Body() body: any) {
  //   return this.authService.logout(body)
  // }
}
