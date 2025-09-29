import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateLanguageBodyDto,
  GetLanguageDetailResDto,
  GetLanguageParamsDto,
  GetLanguagesResDto,
  UpdateLanguageBodyDto,
} from 'src/routes/languages/language.dto'
import { LanguageService } from 'src/routes/languages/language.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDto } from 'src/shared/dto/response.dto'

@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @ZodSerializerDto(GetLanguagesResDto)
  findAll() {
    return this.languageService.findAll()
  }

  @Get(':languageId')
  @ZodSerializerDto(GetLanguageDetailResDto)
  findById(@Param() params: GetLanguageParamsDto) {
    return this.languageService.findById(params.languageId)
  }

  @Post()
  @ZodSerializerDto(GetLanguageDetailResDto)
  create(@Body() body: CreateLanguageBodyDto, @ActiveUser('userId') userId: number) {
    return this.languageService.create({ data: body, createdById: userId })
  }

  @Put(':languageId')
  @ZodSerializerDto(GetLanguageDetailResDto)
  update(
    @Param() params: GetLanguageParamsDto,
    @Body() body: UpdateLanguageBodyDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.languageService.update({ id: params.languageId, data: body, updatedById: userId })
  }

  @Delete(':languageId')
  @ZodSerializerDto(MessageResDto)
  delete(@Param() params: GetLanguageParamsDto) {
    return this.languageService.delete(params.languageId)
  }
}
