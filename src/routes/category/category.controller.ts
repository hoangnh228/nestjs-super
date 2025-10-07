import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateCategoryBodyDto,
  GetAllCategoriesQueryDto,
  GetAllCategoriesResDto,
  GetCategoryDetailResDto,
  GetCategoryParamsDto,
  UpdateCategoryBodyDto,
} from 'src/routes/category/category.dto'
import { CategoryService } from 'src/routes/category/category.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDto } from 'src/shared/dto/response.dto'

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(GetAllCategoriesResDto)
  findAll(@Query() query: GetAllCategoriesQueryDto) {
    return this.categoryService.findAll(query.parentCategoryId)
  }

  @Get(':categoryId')
  @IsPublic()
  @ZodSerializerDto(GetCategoryDetailResDto)
  findById(@Param() params: GetCategoryParamsDto) {
    return this.categoryService.findById(params.categoryId)
  }

  @Post()
  @ZodSerializerDto(GetCategoryDetailResDto)
  create(@Body() body: CreateCategoryBodyDto, @ActiveUser('userId') userId: number) {
    return this.categoryService.create({ data: body, createdById: userId })
  }

  @Post(':categoryId')
  @ZodSerializerDto(GetCategoryDetailResDto)
  update(
    @Param() params: GetCategoryParamsDto,
    @Body() body: UpdateCategoryBodyDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.categoryService.update({ id: params.categoryId, data: body, updatedById: userId })
  }

  @Delete(':categoryId')
  @ZodSerializerDto(MessageResDto)
  delete(@Param() params: GetCategoryParamsDto, @ActiveUser('userId') userId: number) {
    return this.categoryService.delete({ id: params.categoryId, deletedById: userId })
  }
}
