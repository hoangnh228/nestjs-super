import { Body, Controller, Get, Ip, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  ForgotPasswordBodyDto,
  GetAuthorizeUrlResDto,
  LoginBodyDto,
  LoginResponseDto,
  LogoutBodyDto,
  RefreshTokenBodyDto,
  RefreshTokenResponseDto,
  RegisterBodyDto,
  RegisterResponseDto,
  SendOtpBodyDto,
} from 'src/routes/auth/auth.dto'
import { AuthService } from 'src/routes/auth/auth.service'
import { GoogleService } from 'src/routes/auth/google.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'
import { MessageResDto } from 'src/shared/dto/response.dto'
import env from 'src/shared/config'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @ZodSerializerDto(RegisterResponseDto)
  @IsPublic()
  register(@Body() body: RegisterBodyDto) {
    return this.authService.register(body)
  }

  @Post('otp')
  @ZodSerializerDto(MessageResDto)
  @IsPublic()
  sendOtp(@Body() body: SendOtpBodyDto) {
    return this.authService.sendOtp(body)
  }

  @Post('login')
  @ZodSerializerDto(LoginResponseDto)
  @IsPublic()
  login(@Body() body: LoginBodyDto, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.login({ ...body, userAgent, ip })
  }

  @Post('refresh-token')
  @ZodSerializerDto(RefreshTokenResponseDto)
  @IsPublic()
  refreshToken(@Body() body: RefreshTokenBodyDto, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.refreshToken({ refreshToken: body.refreshToken, userAgent, ip })
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDto)
  logout(@Body() body: LogoutBodyDto) {
    return this.authService.logout(body)
  }

  @Get('google-login')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizeUrlResDto)
  getAuthorizeUrl(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.googleService.getOAuthUrl({ userAgent, ip })
  }

  @Get('google/callback')
  @IsPublic()
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      const data = await this.googleService.googleCallback({ code, state })
      return res.redirect(
        `${env.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`,
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login with google'
      return res.redirect(`${env.GOOGLE_CLIENT_REDIRECT_URI}/auth/google-callback?errorMessage=${errorMessage}`)
    }
  }

  @Post('forgot-password')
  @ZodSerializerDto(MessageResDto)
  @IsPublic()
  forgotPassword(@Body() body: ForgotPasswordBodyDto) {
    return this.authService.forgotPassword(body)
  }
}
