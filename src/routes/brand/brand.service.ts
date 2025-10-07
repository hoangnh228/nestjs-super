import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateBrandBodyType, UpdateBrandBodyType } from 'src/routes/brand/brand.model'
import { BrandRepo } from 'src/routes/brand/brand.repo'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { I18nContext, I18nService } from 'nestjs-i18n'
import { I18nTranslations } from 'src/generated/i18n.generated'

@Injectable()
export class BrandService {
  constructor(
    private brandRepo: BrandRepo,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  list(pagination: PaginationQueryType) {
    return this.brandRepo.list(pagination, I18nContext.current()?.lang as string)
  }

  async findById(id: number) {
    const brand = await this.brandRepo.findById(id, I18nContext.current()?.lang as string)
    if (!brand) throw new NotFoundException('Brand not found')
    return brand
  }

  create({ createdById, data }: { createdById: number; data: CreateBrandBodyType }) {
    return this.brandRepo.create({ createdById, data })
  }

  async update({ id, updatedById, data }: { id: number; updatedById: number; data: UpdateBrandBodyType }) {
    try {
      return await this.brandRepo.update({ id, updatedById, data })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Brand not found')
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.brandRepo.delete({ id, deletedById })
      return { message: 'Brand deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Brand not found')
      }
      throw error
    }
  }
}
