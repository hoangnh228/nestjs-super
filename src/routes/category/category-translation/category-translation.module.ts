import { Module } from '@nestjs/common'
import { CategoryTranslationController } from 'src/routes/category/category-translation/category-translation.controller'
import { CategoryTranslationRepo } from 'src/routes/category/category-translation/category-translation.repo'
import { CategoryTranslationService } from 'src/routes/category/category-translation/category-translation.service'

@Module({
  controllers: [CategoryTranslationController],
  providers: [CategoryTranslationService, CategoryTranslationRepo],
})
export class CategoryTranslationModule {}
