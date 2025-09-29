import { Injectable } from '@nestjs/common'
import { DeviceType, RefreshTokenType, RoleType, VerificationCodeType } from 'src/routes/auth/auth.model'
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Pick<UserType, 'roleId' | 'email' | 'name' | 'password' | 'phoneNumber'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.prismaService.user.create({
      data: user,
      omit: { password: true, totpSecret: true },
    })
  }

  async createUserIncludeRole(
    user: Pick<UserType, 'roleId' | 'email' | 'name' | 'password' | 'phoneNumber' | 'avatar'>,
  ): Promise<UserType & { role: RoleType }> {
    return this.prismaService.user.create({
      data: user,
      include: { role: true },
    })
  }

  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'type' | 'code' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    return this.prismaService.verificationCode.upsert({
      where: { email_code_type: { email: payload.email, code: payload.code, type: payload.type } },
      create: payload,
      update: { code: payload.code, expiresAt: payload.expiresAt },
    })
  }

  async findVerificationCode(
    where: { id: number } | { email_code_type: { email: string; code: string; type: TypeOfVerificationCodeType } },
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findUnique({
      where,
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

  findUserWithRole(where: { email: string } | { id: number }): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({
      where,
      include: { role: true },
    })
  }

  findRefreshTokenWithRole(where: {
    token: string
  }): Promise<(RefreshTokenType & { user: UserType & { role: RoleType } }) | null> {
    return this.prismaService.refreshToken.findUnique({
      where,
      include: { user: { include: { role: true } } },
    })
  }

  updateDevice(deviceId, data: Partial<DeviceType>) {
    return this.prismaService.device.update({
      where: { id: deviceId },
      data,
    })
  }

  deleteRefreshToken(payload: { token: string }): Promise<RefreshTokenType> {
    return this.prismaService.refreshToken.delete({
      where: { token: payload.token },
    })
  }

  updateUser(
    where: { id: number } | { email: string },
    data: Partial<Omit<UserType, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
  ): Promise<UserType> {
    return this.prismaService.user.update({
      where,
      data,
    })
  }

  deleteVerificationCode(
    where: { id: number } | { email_code_type: { email: string; code: string; type: TypeOfVerificationCodeType } },
  ): Promise<VerificationCodeType> {
    return this.prismaService.verificationCode.delete({
      where,
    })
  }
}
