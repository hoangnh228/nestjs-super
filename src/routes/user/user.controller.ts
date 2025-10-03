import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { UserService } from './user.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateUserBodyDto,
  GetUserParamsDto,
  GetUsersResDto,
  GetUsersQueryDto,
  CreateUserResDto,
} from 'src/routes/user/user.dto'
import { GetUserProfileResDto, UpdateProfileResDto } from 'src/shared/dto/shared-user.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ActiveRolePermissions } from 'src/shared/decorators/active-role-permissions.decorator'
import { MessageResDto } from 'src/shared/dto/response.dto'

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ZodSerializerDto(GetUsersResDto)
  list(@Query() query: GetUsersQueryDto) {
    return this.userService.list({
      page: query.page,
      limit: query.limit,
    })
  }

  @Get(':userId')
  @ZodSerializerDto(GetUserProfileResDto)
  findById(@Param() params: GetUserParamsDto) {
    return this.userService.findById(params.userId)
  }

  @Post()
  @ZodSerializerDto(CreateUserResDto)
  create(
    @Body() body: CreateUserBodyDto,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.userService.create({
      data: body,
      createdById: userId,
      createdByRoleName: roleName,
    })
  }

  @Put(':userId')
  @ZodSerializerDto(UpdateProfileResDto)
  update(
    @Body() body: CreateUserBodyDto,
    @Param() params: GetUserParamsDto,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.userService.update({
      id: params.userId,
      data: body,
      updatedById: userId,
      updatedByRoleName: roleName,
    })
  }

  @Delete(':userId')
  @ZodSerializerDto(MessageResDto)
  delete(
    @Param() params: GetUserParamsDto,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermissions('name') roleName: string,
  ) {
    return this.userService.delete({
      id: params.userId,
      deletedById: userId,
      deletedByRoleName: roleName,
    })
  }
}
