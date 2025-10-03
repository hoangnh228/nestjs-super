import { BadRequestException, Injectable } from '@nestjs/common'
import {
  CreateRoleBodyType,
  GetRolesQueryType,
  GetRolesResType,
  RoleWithPermissionsType,
  UpdateRoleBodyType,
} from 'src/routes/role/role.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleType } from '../../shared/models/shared-role.model'

@Injectable()
export class RoleRepo {
  constructor(private readonly prisma: PrismaService) {}

  async list(pagination: GetRolesQueryType): Promise<GetRolesResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const [data, totalItems] = await Promise.all([
      this.prisma.role.findMany({ skip, take, where: { deletedAt: null } }),
      this.prisma.role.count({ where: { deletedAt: null } }),
    ])

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  async findById(id: number): Promise<RoleWithPermissionsType | null> {
    return this.prisma.role.findUnique({
      where: { id, deletedAt: null },
      include: { permissions: { where: { deletedAt: null } } },
    })
  }

  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: number }): Promise<RoleType> {
    return this.prisma.role.create({ data: { ...data, createdById } })
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdateRoleBodyType
    updatedById: number
  }): Promise<RoleType> {
    if (data.permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: data.permissionIds }, deletedAt: null },
      })

      const deletedPermissions = permissions.filter((permission) => permission.deletedAt)
      if (deletedPermissions.length > 0) {
        const deletedIds = deletedPermissions.map((permission) => permission.id).join(', ')
        throw new BadRequestException(`Some permissions are deleted: ${deletedIds}`)
      }
    }

    return this.prisma.role.update({
      where: { id, deletedAt: null },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: { set: data.permissionIds.map((id) => ({ id })) },
        updatedById,
      },
      include: { permissions: { where: { deletedAt: null } } },
    })
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean): Promise<RoleType> {
    return isHard
      ? this.prisma.role.delete({ where: { id } })
      : this.prisma.role.update({
          where: { id, deletedAt: null },
          data: { deletedAt: new Date(), deletedById },
        })
  }
}
