import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateCategoryTranslationBodyDto,
  GetCategoryTranslationDetailResDto,
  GetCategoryTranslationParamsDto,
  UpdateCategoryTranslationBodyDto,
} from 'src/routes/category/category-translation/category-translation.dto'
import { CategoryTranslationService } from 'src/routes/category/category-translation/category-translation.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDto } from 'src/shared/dto/response.dto'

@Controller('category-translations')
export class CategoryTranslationController {
  constructor(private categoryTranslationService: CategoryTranslationService) {}

  @Get(':categoryTranslationId')
  @ZodSerializerDto(GetCategoryTranslationDetailResDto)
  findById(@Param() params: GetCategoryTranslationParamsDto) {
    return this.categoryTranslationService.findById(params.categoryTranslationId)
  }

  @Post()
  @ZodSerializerDto(GetCategoryTranslationDetailResDto)
  create(@Body() body: CreateCategoryTranslationBodyDto, @ActiveUser('userId') userId: number) {
    return this.categoryTranslationService.create({ createdById: userId, data: body })
  }

  @Put(':categoryTranslationId')
  @ZodSerializerDto(GetCategoryTranslationDetailResDto)
  update(
    @Param() params: GetCategoryTranslationParamsDto,
    @Body() body: UpdateCategoryTranslationBodyDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.categoryTranslationService.update({ id: params.categoryTranslationId, updatedById: userId, data: body })
  }

  @Delete(':categoryTranslationId')
  @ZodSerializerDto(MessageResDto)
  delete(@Param() params: GetCategoryTranslationParamsDto, @ActiveUser('userId') userId: number) {
    return this.categoryTranslationService.delete({ id: params.categoryTranslationId, deletedById: userId })
  }
}
