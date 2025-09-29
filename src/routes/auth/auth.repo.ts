import { Injectable } from '@nestjs/common'
import { DeviceType, RegisterBodyType, RoleType, VerificationCodeType } from 'src/routes/auth/auth.model'
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.prismaService.user.create({
      data: user,
      omit: { password: true, totpSecret: true },
    })
  }

  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'type' | 'code' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    return this.prismaService.verificationCode.upsert({
      where: { email_type: { email: payload.email, type: payload.type } },
      create: payload,
      update: { code: payload.code, expiresAt: payload.expiresAt },
    })
  }

  async findVerificationCode(
    payload: { email: string } | { id: number } | { email: string; code: string; type: TypeOfVerificationCodeType },
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findFirst({
      where: payload,
    })
  }

  createRefreshToken(data: { userId: number; token: string; expiresAt: Date; deviceId: number }) {
    return this.prismaService.refreshToken.create({ data })
  }

  createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ) {
    return this.prismaService.device.create({ data })
  }

  findUserWithRole(payload: { email: string } | { id: number }): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({
      where: payload,
      include: { role: true },
    })
  }
}
