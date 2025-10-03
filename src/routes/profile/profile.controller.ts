import { Body, Controller, Get, Put } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { ProfileService } from 'src/routes/profile/profile.service'
import { ChangePasswordBodyDto, UpdateMeBodyDto } from 'src/routes/profile/profule.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDto } from 'src/shared/dto/response.dto'
import { GetUserProfileResDto, UpdateProfileResDto } from 'src/shared/dto/shared-user.dto'

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ZodSerializerDto(GetUserProfileResDto)
  getProfile(@ActiveUser('userId') userId: number) {
    return this.profileService.getProfile(userId)
  }

  @Put()
  @ZodSerializerDto(UpdateProfileResDto)
  updateProfile(@ActiveUser('userId') userId: number, @Body() body: UpdateMeBodyDto) {
    return this.profileService.updateProfile({ userId, body })
  }

  @Put('change-password')
  @ZodSerializerDto(MessageResDto)
  changePassword(@ActiveUser('userId') userId: number, @Body() body: ChangePasswordBodyDto) {
    return this.profileService.changePassword({ userId, body })
  }
}
