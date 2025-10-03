import { HashingService } from 'src/shared/services/hashing.service'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ChangePasswordBodyType, UpdateMeBodyType } from 'src/routes/profile/profile.model'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class ProfileService {
  constructor(
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly hashingService: HashingService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.sharedUserRepository.findUniqueWithRoleAndPermissions({ id: userId, deletedAt: null })
    console.log(user)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async updateProfile({ userId, body }: { userId: number; body: UpdateMeBodyType }) {
    try {
      return await this.sharedUserRepository.update({ id: userId, deletedAt: null }, { ...body, updatedById: userId })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('User not found')
      }
      throw error
    }
  }

  async changePassword({ userId, body }: { userId: number; body: Omit<ChangePasswordBodyType, 'confirmNewPassword'> }) {
    try {
      const { password, newPassword } = body
      const user = await this.sharedUserRepository.findUnique({ id: userId, deletedAt: null })

      if (!user) {
        throw new NotFoundException('User not found')
      }

      const isPasswordMatch = await this.hashingService.compare(password, user.password)
      if (!isPasswordMatch) {
        throw new NotFoundException('Password does not match')
      }

      const hashedPassword = await this.hashingService.hash(newPassword)
      await this.sharedUserRepository.update(
        { id: userId, deletedAt: null },
        { password: hashedPassword, updatedById: userId },
      )

      return { message: 'Password changed successfully' }
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new NotFoundException('User not found')
      }
      throw error
    }
  }
}
