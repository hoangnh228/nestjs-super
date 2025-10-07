import { Module } from '@nestjs/common'
import { CategoryController } from 'src/routes/category/category.controller'
import { CategoryRepo } from 'src/routes/category/category.repo'
import { CategoryService } from 'src/routes/category/category.service'

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepo],
})
export class CategoryModule {}
