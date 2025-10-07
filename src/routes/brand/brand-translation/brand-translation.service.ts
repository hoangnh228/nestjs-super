import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateBrandTranslationBodyType,
  UpdateBrandTranslationBodyType,
} from 'src/routes/brand/brand-translation/brand-translation.model'
import { BrandTranslationRepo } from 'src/routes/brand/brand-translation/brand-translation.repo'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class BrandTranslationService {
  constructor(private brandTranslationRepo: BrandTranslationRepo) {}

  async findById(id: number) {
    const brandTranslation = await this.brandTranslationRepo.findById(id)
    if (!brandTranslation) {
      throw new NotFoundException('Brand translation not found')
    }
    return brandTranslation
  }

  create({ createdById, data }: { createdById: number; data: CreateBrandTranslationBodyType }) {
    try {
      return this.brandTranslationRepo.create({ createdById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('Brand translation already exists for this language')
      }
      throw error
    }
  }

  async update({ id, updatedById, data }: { id: number; updatedById: number; data: UpdateBrandTranslationBodyType }) {
    try {
      return await this.brandTranslationRepo.update({ id, updatedById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('Brand translation already exists for this language')
      }
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Brand translation not found')
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean) {
    try {
      await this.brandTranslationRepo.delete({ id, deletedById }, isHard)
      return { message: 'Brand translation deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Brand translation not found')
      }
      throw error
    }
  }
}
