import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateProductTranslationBodyType,
  UpdateProductTranslationBodyType,
} from 'src/routes/product/product-translation/product-translation.model'
import { ProductTranslationRepo } from 'src/routes/product/product-translation/product-translation.repo'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class ProductTranslationService {
  constructor(private productTranslationRepo: ProductTranslationRepo) {}

  async findById(id: number) {
    const productTranslation = await this.productTranslationRepo.findById(id)
    if (!productTranslation) {
      throw new NotFoundException('Product translation not found')
    }
    return productTranslation
  }

  create({ createdById, data }: { createdById: number; data: CreateProductTranslationBodyType }) {
    try {
      return this.productTranslationRepo.create({ createdById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('Product translation already exists for this language')
      }
      throw error
    }
  }

  async update({ id, updatedById, data }: { id: number; updatedById: number; data: UpdateProductTranslationBodyType }) {
    try {
      return await this.productTranslationRepo.update({ id, updatedById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('Product translation already exists for this language')
      }
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Product translation not found')
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean) {
    try {
      await this.productTranslationRepo.delete({ id, deletedById }, isHard)
      return { message: 'Product translation deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Product translation not found')
      }
      throw error
    }
  }
}
