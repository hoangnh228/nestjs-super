import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import {
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
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly rolesService: RolesService,
    private readonly tokenService: TokenService,
    private readonly hashingService: HashingService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const verificationCode = await this.authRepository.findVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      })

      if (!verificationCode) {
        throw new UnprocessableEntityException([
          {
            message: 'Verification code is invalid',
            path: 'code',
          },
        ])
      }

      if (verificationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException([
          {
            message: 'Verification code is expired',
            path: 'code',
          },
        ])
      }

      return await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        password: hashedPassword,
        phoneNumber: body.phoneNumber,
        roleId: clientRoleId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email already exists')
      }
      throw error
    }
  }

  async sendOtp(body: SendOtpBodyType) {
    // 1. check if user exists
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (user) {
      throw new UnprocessableEntityException([
        {
          message: 'Email already exists',
          path: 'email',
        },
      ])
    }

    // 2. generate otp and create verification code
    const otp = generateOtp()
    const verificationCode = await this.authRepository.createVerificationCode({
      email: body.email,
      type: body.type,
      code: otp,
      expiresAt: addMilliseconds(new Date(), ms(env.OTP_EXPIRES_IN as ms.StringValue)),
    })

    const { error } = await this.emailService.sendOtp({ email: body.email, code: verificationCode.code })

    if (error) {
      throw new UnprocessableEntityException([
        {
          message: 'Failed to send OTP email',
          path: 'code',
        },
      ])
    }

    return { message: 'OTP sent successfully' }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    const user = await this.authRepository.findUserWithRole({
      email: body.email,
    })

    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'User not found',
          path: 'email',
        },
      ])
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw new UnprocessableEntityException([
        {
          message: 'Invalid password',
          path: 'password',
        },
      ])
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
}
