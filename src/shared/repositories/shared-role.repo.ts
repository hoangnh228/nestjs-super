import { Injectable } from '@nestjs/common'
import { ROLES } from 'src/shared/constants/role.constants'
import { RoleType } from 'src/shared/models/shared-role.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedRoleRepository {
  private clientRoleId: number | null = null
  private adminRoleId: number | null = null

  constructor(private readonly prismaService: PrismaService) {}

  private async getRole(roleName: string) {
    return await this.prismaService
      .$queryRaw`SELECT * FROM "Role" WHERE "name" = ${roleName} AND "deletedAt" IS NULL LIMIT 1`.then(
      (res: RoleType[]) => {
        if (res.length > 0) {
          return res[0]
        }
        throw new Error('Role not found')
      },
    )
  }

  async getClientRoleId() {
    if (this.clientRoleId) {
      return this.clientRoleId
    }

    const role = await this.getRole(ROLES.CLIENT)
    this.clientRoleId = role.id
    return role.id
  }

  async getAdminRoleId() {
    if (this.adminRoleId) {
      return this.adminRoleId
    }

    const role = await this.getRole(ROLES.ADMIN)
    this.adminRoleId = role.id
    return role.id
  }
}
