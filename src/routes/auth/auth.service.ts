import { ConflictException, Injectable } from '@nestjs/common'
import { AuthRepository } from 'src/routes/auth/au.repo'
import { RegisterBodyType } from 'src/routes/auth/auth.model'
import { RolesService } from 'src/routes/auth/roles.service'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly rolesService: RolesService,
    private readonly tokenService: TokenService,
    private readonly hashingService: HashingService,
    private readonly authRepository: AuthRepository,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
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
