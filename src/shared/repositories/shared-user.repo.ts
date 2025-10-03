import { Injectable } from '@nestjs/common'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleType } from '../models/shared-role.model'
import { PermissionType } from '../models/shared-permission.model'

export type UserIncludeRolePermissionType = UserType & { role: RoleType & { permissions: PermissionType[] } }
export type WhereUniqueUserType = { id: number; [key: string]: any } | { email: string; [key: string]: any }

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findUnique(where: WhereUniqueUserType): Promise<UserType | null> {
    return this.prismaService.user.findUnique({
      where,
    })
  }

  findUniqueWithRoleAndPermissions(where: WhereUniqueUserType): Promise<UserIncludeRolePermissionType | null> {
    return this.prismaService.user.findUnique({
      where,
      include: { role: { include: { permissions: { where: { deletedAt: null } } } } },
    })
  }

  update(where: WhereUniqueUserType, data: Partial<UserType>): Promise<UserType | null> {
    return this.prismaService.user.update({
      where,
      data,
    })
  }
}
