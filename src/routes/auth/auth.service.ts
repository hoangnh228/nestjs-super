import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { RegisterBodyType, SendOtpBodyType } from 'src/routes/auth/auth.model'
import { RolesService } from 'src/routes/auth/roles.service'
import { generateOtp, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import env from 'src/shared/config'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'

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

      const { error } = await this.emailService.sendOtp({ email: body.email, code: verificationCode.code })

      if (error) {
        throw new UnprocessableEntityException([
          {
            message: 'Failed to send OTP email',
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
      expiresAt: addMilliseconds(new Date(), ms(env.OTP_EXPIRES_IN)),
    })

    return verificationCode
  }

  // async login(body: any) {
  //   try {
  //     const user = await this.prismaService.user.findUniqueOrThrow({
  //       where: { email: body.email },
  //     })
  //   } catch (error) {}
  // }

  // async refreshToken(body: any) {
  //   try {
  //     const user = await this.prismaService.user.findUniqueOrThrow({
  //       where: { email: body.email },
  //     })
  //   } catch (error) {}
  // }

  // async logout(body: any) {
  //   try {
  //     const user = await this.prismaService.user.findUniqueOrThrow({
  //       where: { email: body.email },
  //     })
  //   } catch (error) {}
  // }
}
