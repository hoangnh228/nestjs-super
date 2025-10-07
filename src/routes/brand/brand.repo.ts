import { Injectable } from '@nestjs/common'
import {
  BrandIncludeTranslationType,
  CreateBrandBodyType,
  GetBrandsResType,
  UpdateBrandBodyType,
} from 'src/routes/brand/brand.model'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class BrandRepo {
  constructor(private prismaService: PrismaService) {}

  async list(pagination: PaginationQueryType, languageId?: string): Promise<GetBrandsResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const [brands, totalItems] = await Promise.all([
      this.prismaService.brand.findMany({
        where: { deletedAt: null },
        include: {
          brandTranslations: { where: languageId ? { languageId, deletedAt: null } : { deletedAt: null } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.brand.count({ where: { deletedAt: null } }),
    ])

    return {
      data: brands,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  findById(id: number, languageId?: string): Promise<BrandIncludeTranslationType | null> {
    return this.prismaService.brand.findUnique({
      where: { id, deletedAt: null },
      include: {
        brandTranslations: { where: languageId ? { languageId, deletedAt: null } : { deletedAt: null } },
      },
    })
  }

  create({ createdById, data }: { createdById: number | null; data: CreateBrandBodyType }) {
    return this.prismaService.brand.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        brandTranslations: {
          where: { deletedAt: null },
        },
      },
    })
  }

  update({ id, updatedById, data }: { id: number; updatedById: number | null; data: UpdateBrandBodyType }) {
    return this.prismaService.brand.update({
      where: { id, deletedAt: null },
      data: {
        ...data,
        updatedById,
      },
      include: {
        brandTranslations: {
          where: { deletedAt: null },
        },
      },
    })
  }

  delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean) {
    return isHard
      ? this.prismaService.brand.delete({ where: { id } })
      : this.prismaService.brand.update({
          where: { id, deletedAt: null },
          data: { deletedAt: new Date(), deletedById },
        })
  }
}
