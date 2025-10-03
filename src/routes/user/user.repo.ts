import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { CreateUserBodyType, GetUsersQueryType, GetUsersResType } from './user.model'

@Injectable()
export class UserRepo {
  constructor(private prismaService: PrismaService) {}

  async list(pagination: GetUsersQueryType): Promise<GetUsersResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const [data, totalItems] = await Promise.all([
      this.prismaService.user.findMany({ skip, take, where: { deletedAt: null }, include: { role: true } }),
      this.prismaService.user.count({ where: { deletedAt: null } }),
    ])

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  create({ createdById, data }: { createdById: number | null; data: CreateUserBodyType }) {
    return this.prismaService.user.create({ data: { ...data, createdById } })
  }

  delete({ id, deletedById }: { id: number; deletedById: number | null }, isHard?: boolean) {
    return isHard
      ? this.prismaService.user.delete({ where: { id } })
      : this.prismaService.user.update({ where: { id, deletedAt: null }, data: { deletedById, deletedAt: new Date() } })
  }
}
