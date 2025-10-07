import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateCategoryTranslationBodyType,
  UpdateCategoryTranslationBodyType,
} from 'src/routes/category/category-translation/category-translation.model'
import { CategoryTranslationRepo } from 'src/routes/category/category-translation/category-translation.repo'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class CategoryTranslationService {
  constructor(private categoryTranslationRepo: CategoryTranslationRepo) {}

  async findById(id: number) {
    const categoryTranslation = await this.categoryTranslationRepo.findById(id)
    if (!categoryTranslation) {
      throw new NotFoundException('Category translation not found')
    }
    return categoryTranslation
  }

  create({ createdById, data }: { createdById: number; data: CreateCategoryTranslationBodyType }) {
    try {
      return this.categoryTranslationRepo.create({ createdById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('Category translation already exists for this language')
      }
      throw error
    }
  }

  async update({
    id,
    updatedById,
    data,
  }: {
    id: number
    updatedById: number
    data: UpdateCategoryTranslationBodyType
  }) {
    try {
      return await this.categoryTranslationRepo.update({ id, updatedById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('Category translation already exists for this language')
      }
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Category translation not found')
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean) {
    try {
      await this.categoryTranslationRepo.delete({ id, deletedById }, isHard)
      return { message: 'Category translation deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Category translation not found')
      }
      throw error
    }
  }
}
