import { HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import {
  Disable2FABodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOtpBodyType,
} from 'src/routes/auth/auth.model'
import { RolesService } from 'src/routes/auth/roles.service'
import { generateOtp, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import env from 'src/shared/config'
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import { TwoFactorAuthenticationService } from 'src/shared/services/2fa.service'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  ExpiredOtpException,
  FailedToSendOtpEmailException,
  InvalidOtpException,
  InvalidPasswordException,
  TwoFactorInvalidException,
  TwoFactorNotSetupException,
  TwoFactorOrEmailOtpRequiredException,
  UserNotFoundException,
} from 'src/routes/auth/auth.error'

@Injectable()
export class AuthService {
  constructor(
    private readonly rolesService: RolesService,
    private readonly tokenService: TokenService,
    private readonly hashingService: HashingService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
  ) {}

  async verifyVerificationCode(email: string, code: string, type: TypeOfVerificationCodeType) {
    const verificationCode = await this.authRepository.findVerificationCode({
      email_code_type: { email, code, type },
    })

    if (!verificationCode) {
      throw InvalidOtpException
    }

    if (verificationCode.expiresAt < new Date()) {
      throw ExpiredOtpException
    }

    return verificationCode
  }

  async register(body: RegisterBodyType) {
    try {
      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      await this.verifyVerificationCode(body.email, body.code, TypeOfVerificationCode.REGISTER)
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          password: hashedPassword,
          phoneNumber: body.phoneNumber,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_code_type: { email: body.email, code: body.code, type: TypeOfVerificationCode.REGISTER },
        }),
      ])

      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
      }
      throw error
    }
  }

  async sendOtp(body: SendOtpBodyType) {
    // 1. check if user exists
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (user && body.type === TypeOfVerificationCode.REGISTER) {
      throw EmailAlreadyExistsException
    }

    if (!user && body.type === TypeOfVerificationCode.FORGOT_PASSWORD) {
      throw EmailNotFoundException
    }

    // 2. generate otp and create verification code
    const code = generateOtp()
    await this.authRepository.createVerificationCode({
      email: body.email,
      type: body.type,
      code: code,
      expiresAt: addMilliseconds(new Date(), ms(env.OTP_EXPIRES_IN as ms.StringValue)),
    })

    const { error } = await this.emailService.sendOtp({ email: body.email, code })

    if (error) {
      throw FailedToSendOtpEmailException
    }

    return { message: 'OTP sent successfully' }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    const user = await this.authRepository.findUserWithRole({
      email: body.email,
    })

    if (!user) {
      throw UserNotFoundException
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw InvalidPasswordException
    }

    if (user.totpSecret) {
      if (!body.totpCode && !body.code) {
        throw TwoFactorOrEmailOtpRequiredException
      }

      if (body.totpCode) {
        const isValid = this.twoFactorAuthenticationService.verifyTOTP({
          email: user.email,
          token: body.totpCode,
          secret: user.totpSecret,
        })

        if (!isValid) {
          throw TwoFactorInvalidException
        }
      } else if (body.code) {
        await this.verifyVerificationCode(user.email, body.code, TypeOfVerificationCode.LOGIN)
      }
    }

    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })

    const tokens = await this.generateTokens({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
      deviceId: device.id,
    })

    return tokens
  }

  async generateTokens({ userId, roleId, roleName, deviceId }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({ userId, roleId, roleName, deviceId }),
      this.tokenService.signRefreshToken({ userId }),
    ])

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      userId,
      token: refreshToken,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      deviceId,
    })

    return { accessToken, refreshToken }
  }

  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      // 1. verify refresh token
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)

      // 2. check if refresh token is valid
      const refreshTokenWithRole = await this.authRepository.findRefreshTokenWithRole({ token: refreshToken })
      if (!refreshTokenWithRole) {
        throw new UnprocessableEntityException([{ message: 'Refresh token is invalid', path: 'refreshToken' }])
      }

      // 3. update device
      const $updateDevice = this.authRepository.updateDevice(refreshTokenWithRole.deviceId, {
        ip,
        userAgent,
      })

      // 4. delete refresh token
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({ token: refreshToken })

      // 5. generate new tokens
      const $tokens = this.generateTokens({
        userId,
        roleId: refreshTokenWithRole.user.roleId,
        roleName: refreshTokenWithRole.user.role.name,
        deviceId: refreshTokenWithRole.deviceId,
      })
      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens])

      return tokens
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }

  async logout(body: LogoutBodyType) {
    try {
      // 1. verify refresh token
      await this.tokenService.verifyRefreshToken(body.refreshToken)

      // 2. delete refresh token
      const deletedRefreshToken = await this.authRepository.deleteRefreshToken({ token: body.refreshToken })

      // 3. update device logged out
      await this.authRepository.updateDevice(deletedRefreshToken.deviceId, {
        isActive: false,
      })

      return { message: 'Logout successful' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token is invalid')
      }
      throw new UnauthorizedException()
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, code, newPassword } = body

    // 1. check email exists
    const user = await this.sharedUserRepository.findUnique({ email })
    if (!user) {
      throw EmailNotFoundException
    }

    // 2. check otp
    await this.verifyVerificationCode(email, code, TypeOfVerificationCode.FORGOT_PASSWORD)

    // 3. update password and delete otp
    const hashedPassword = await this.hashingService.hash(newPassword)
    await Promise.all([
      this.authRepository.updateUser(
        { id: user.id },
        {
          password: hashedPassword,
        },
      ),
      this.authRepository.deleteVerificationCode({
        email_code_type: { email, code, type: TypeOfVerificationCode.FORGOT_PASSWORD },
      }),
    ])

    return { message: 'Password updated successfully' }
  }

  async setup2FA(userId: number) {
    // 1. check user exists, check 2fa is already setup
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw new UnprocessableEntityException([{ message: 'User not found', path: 'userId' }])
    }

    if (user.totpSecret) {
      throw new UnprocessableEntityException([{ message: '2FA is already setup', path: 'userId' }])
    }

    // 2. generate totp secret
    const { secret, uri } = this.twoFactorAuthenticationService.generateTOTP(user.email)

    // 3. update user totp secret
    await this.authRepository.updateUser(
      { id: userId },
      {
        totpSecret: secret,
      },
    )

    // 4. return totp secret
    return { secret, uri }
  }

  async disable2FA(data: Disable2FABodyType & { userId: number }) {
    const { userId, totpCode, code } = data

    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw UserNotFoundException
    }

    if (!user.totpSecret) {
      throw TwoFactorNotSetupException
    }

    if (totpCode) {
      const isValid = this.twoFactorAuthenticationService.verifyTOTP({
        email: user.email,
        token: totpCode,
        secret: user.totpSecret,
      })

      if (!isValid) {
        throw TwoFactorInvalidException
      }
    } else if (code) {
      await this.verifyVerificationCode(user.email, code, TypeOfVerificationCode.DISABLE_2FA)
    }

    // 5. update user totp secret
    await this.authRepository.updateUser({ id: userId }, { totpSecret: null })

    return { message: '2FA disabled successfully' }
  }
}
