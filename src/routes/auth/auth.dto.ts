import { createZodDto } from 'nestjs-zod'
import {
  LoginBodySchema,
  LoginResSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOtpBodySchema,
  GetAuthorizeUrlResSchema,
  ForgotPasswordBodySchema,
  Setup2FAResSchema,
  Disable2FABodySchema,
} from 'src/routes/auth/auth.model'

export class RegisterBodyDto extends createZodDto(RegisterBodySchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResSchema) {}
export class SendOtpBodyDto extends createZodDto(SendOtpBodySchema) {}
export class LoginBodyDto extends createZodDto(LoginBodySchema) {}
export class LoginResponseDto extends createZodDto(LoginResSchema) {}
export class RefreshTokenBodyDto extends createZodDto(RefreshTokenBodySchema) {}
export class RefreshTokenResponseDto extends createZodDto(RefreshTokenResSchema) {}
export class LogoutBodyDto extends createZodDto(LogoutBodySchema) {}
export class GetAuthorizeUrlResDto extends createZodDto(GetAuthorizeUrlResSchema) {}
export class ForgotPasswordBodyDto extends createZodDto(ForgotPasswordBodySchema) {}
export class Disable2FABodyDto extends createZodDto(Disable2FABodySchema) {}
export class Setup2FAResDto extends createZodDto(Setup2FAResSchema) {}
