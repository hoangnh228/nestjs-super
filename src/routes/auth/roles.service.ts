import { Injectable } from '@nestjs/common'
import { ROLES } from 'src/shared/constants/role.constants'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class RolesService {
  private clientRoleId: number | null = null

  constructor(private readonly prismaService: PrismaService) {}

  async getClientRoleId() {
    if (this.clientRoleId) {
      return this.clientRoleId
    }

    const clientRole = await this.prismaService.role.findUniqueOrThrow({
      where: {
        name: ROLES.CLIENT,
      },
    })
    this.clientRoleId = clientRole.id
    return this.clientRoleId
  }
}
