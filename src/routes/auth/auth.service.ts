import { ConflictException, Injectable } from '@nestjs/common'
import { RolesService } from 'src/routes/auth/roles.service'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly rolesService: RolesService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly hashingService: HashingService,
  ) {}

  async register(body: any) {
    try {
      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const user = await this.prismaService.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
          phoneNumber: body.phoneNumber,
          roleId: clientRoleId,
        },
        omit: { password: true, totpSecret: true },
      })
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email already exists')
      }
      throw error
    }
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
