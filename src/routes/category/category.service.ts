import { Injectable, NotFoundException } from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n/dist/i18n.context'
import { CreateCategoryBodyType, UpdateCategoryBodyType } from 'src/routes/category/category.model'
import { CategoryRepo } from 'src/routes/category/category.repo'

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepo) {}

  findAll(parentCategoryId?: number) {
    return this.categoryRepo.findAll({ parentCategoryId, languageId: I18nContext.current()?.lang as string })
  }

  async findById(id: number) {
    const category = await this.categoryRepo.findById(id, I18nContext.current()?.lang as string)
    if (!category) throw new NotFoundException('Category not found')
    return category
  }

  create({ createdById, data }: { createdById: number; data: CreateCategoryBodyType }) {
    return this.categoryRepo.create({ createdById, data })
  }

  update({ id, data, updatedById }: { id: number; data: UpdateCategoryBodyType; updatedById: number }) {
    return this.categoryRepo.update({ id, data, updatedById })
  }

  delete({ id, deletedById }: { id: number; deletedById: number }) {
    return this.categoryRepo.delete({ id, deletedById })
  }
}
