import { Injectable } from '@nestjs/common'
import {
  CategoryIncludeTranslationType,
  CreateCategoryBodyType,
  GetAllCategoriesResType,
  UpdateCategoryBodyType,
} from 'src/routes/category/category.model'
import { ALL_LANGUAGE_CODE } from 'src/shared/constants/other.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class CategoryRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll({
    parentCategoryId,
    languageId,
  }: {
    parentCategoryId?: number
    languageId: string
  }): Promise<GetAllCategoriesResType> {
    const categories = await this.prismaService.category.findMany({
      where: {
        parentCategoryId: parentCategoryId ?? null,
        deletedAt: null,
      },
      include: {
        categoryTranslations: {
          where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      data: categories,
      totalItems: categories.length,
    }
  }

  findById(id: number, languageId: string): Promise<CategoryIncludeTranslationType | null> {
    return this.prismaService.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        categoryTranslations: {
          where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
        },
      },
    })
  }

  create({ data, createdById }: { data: CreateCategoryBodyType; createdById: number | null }) {
    return this.prismaService.category.create({
      data: {
        ...data,
        createdById,
      },
      include: { categoryTranslations: { where: { deletedAt: null } } },
    })
  }

  update({ id, data, updatedById }: { id: number; data: UpdateCategoryBodyType; updatedById: number }) {
    return this.prismaService.category.update({
      where: { id, deletedAt: null },
      data: {
        ...data,
        updatedById,
      },
      include: { categoryTranslations: { where: { deletedAt: null } } },
    })
  }

  delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean) {
    return isHard
      ? this.prismaService.category.delete({
          where: { id },
        })
      : this.prismaService.category.update({
          where: { id, deletedAt: null },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        })
  }
}
