import { Injectable } from '@nestjs/common'
import {
  CreatePermissionBodyType,
  GetPermissionQueryType,
  GetPermissionsResType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PermissionType } from '../../shared/models/shared-permission.model'

@Injectable()
export class PermissionRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(pagination: GetPermissionQueryType): Promise<GetPermissionsResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const [data, totalItems] = await Promise.all([
      this.prismaService.permission.findMany({ skip, take, where: { deletedAt: null } }),
      this.prismaService.permission.count({ where: { deletedAt: null } }),
    ])

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  findById(id: number): Promise<PermissionType | null> {
    return this.prismaService.permission.findUnique({ where: { id, deletedAt: null } })
  }

  create({ createdById, data }: { createdById: number; data: CreatePermissionBodyType }): Promise<PermissionType> {
    return this.prismaService.permission.create({ data: { ...data, createdById } })
  }

  update({
    updatedById,
    id,
    data,
  }: {
    updatedById: number
    id: number
    data: UpdatePermissionBodyType
  }): Promise<PermissionType & { roles: { id: number }[] }> {
    return this.prismaService.permission.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedById,
      },
      include: {
        roles: true,
      },
    })
  }

  delete(
    { id, deletedById }: { id: number; deletedById: number; isHard?: boolean },
    isHard?: boolean,
  ): Promise<PermissionType & { roles: { id: number }[] }> {
    return isHard
      ? this.prismaService.permission.delete({ where: { id }, include: { roles: true } })
      : this.prismaService.permission.update({
          where: { id, deletedAt: null },
          data: { deletedAt: new Date(), deletedById },
          include: { roles: true },
        })
  }
}
