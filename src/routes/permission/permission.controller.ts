import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreatePermissionBodyDto,
  GetPermissionDetailResDto,
  GetPermissionParamsDto,
  GetPermissionQueryDto,
  GetPermissionsResDto,
  UpdatePermissionBodyDto,
} from 'src/routes/permission/permission.dto'
import { PermissionService } from 'src/routes/permission/permission.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDto } from 'src/shared/dto/response.dto'

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ZodSerializerDto(GetPermissionsResDto)
  findAll(@Query() query: GetPermissionQueryDto) {
    return this.permissionService.list(query)
  }

  @Get(':permissionId')
  @ZodSerializerDto(GetPermissionDetailResDto)
  findById(@Param() params: GetPermissionParamsDto) {
    return this.permissionService.findById(params.permissionId)
  }

  @Post()
  @ZodSerializerDto(GetPermissionDetailResDto)
  create(@Body() body: CreatePermissionBodyDto, @ActiveUser('userId') userId: number) {
    return this.permissionService.create({ data: body, createdById: userId })
  }

  @Put(':permissionId')
  @ZodSerializerDto(GetPermissionDetailResDto)
  update(
    @Param() params: GetPermissionParamsDto,
    @Body() body: UpdatePermissionBodyDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.permissionService.update({ id: params.permissionId, data: body, updatedById: userId })
  }

  @Delete(':permissionId')
  @ZodSerializerDto(MessageResDto)
  delete(@Param() params: GetPermissionParamsDto, @ActiveUser('userId') userId: number) {
    return this.permissionService.delete({ id: params.permissionId, deletedById: userId })
  }
}
