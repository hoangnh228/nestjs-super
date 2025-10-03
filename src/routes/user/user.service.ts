import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { HashingService } from '../../shared/services/hashing.service'
import { UserRepo } from './user.repo'
import { SharedUserRepository } from '../../shared/repositories/shared-user.repo'
import { SharedRoleRepository } from '../../shared/repositories/shared-role.repo'
import { CreateUserBodyType, GetUsersQueryType, UpdateUserBodyType } from './user.model'
import { ROLES } from '../../shared/constants/role.constants'
import {
  isForeignKeyConstraintPrismaError,
  isNotFoundPrismaError,
  isUniqueConstraintPrismaError,
} from '../../shared/helpers'

@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepo,
    private hashingService: HashingService,
    private sharedUserRepository: SharedUserRepository,
    private sharedRoleRepository: SharedRoleRepository,
  ) {}

  list(pagination: GetUsersQueryType) {
    return this.userRepo.list(pagination)
  }

  async findById(id: number) {
    const user = await this.sharedUserRepository.findUniqueWithRoleAndPermissions({ id, deletedAt: null })
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`)
    }
    return user
  }

  async create({
    data,
    createdById,
    createdByRoleName,
  }: {
    data: CreateUserBodyType
    createdById: number
    createdByRoleName: string
  }) {
    try {
      // only admin can create user with role admin
      await this.verifyRole({
        roleNameAgent: createdByRoleName,
        roleIdTarget: data.roleId,
      })

      const hashedPassword = await this.hashingService.hash(data.password)

      return this.userRepo.create({
        createdById,
        data: { ...data, password: hashedPassword },
      })
    } catch (error) {
      if (isForeignKeyConstraintPrismaError(error)) {
        throw new NotFoundException(`Role with id ${data.roleId} not found`)
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw new ForbiddenException('Email already exists')
      }
      throw error
    }
  }

  /**
   * Verify if the agent has the right to perform action to other user
   * because only admin can: create admin user, update roleId to admin, delete admin user
   * if not admin, cannot perform action to admin user
   */
  private async verifyRole({ roleNameAgent, roleIdTarget }) {
    // only allow admin
    if (roleNameAgent === ROLES.ADMIN) {
      return true
    }

    // if not admin, roleIdTarget must not be admin
    const adminRoleId = await this.sharedRoleRepository.getAdminRoleId()
    if (roleIdTarget === adminRoleId) {
      throw new ForbiddenException()
    }
    return true
  }

  async update({
    id,
    data,
    updatedById,
    updatedByRoleName,
  }: {
    id: number
    data: UpdateUserBodyType
    updatedById: number
    updatedByRoleName: string
  }) {
    try {
      // cannot update oneself
      if (id === updatedById) {
        throw new ForbiddenException('You cannot update yourself')
      }

      const currentUser = await this.findById(id)

      // get roleId of user need to updat, verify if updater has right access
      // not use data.roleId because it may be intentionally passed incorrectly
      const roleIdTarget = currentUser.roleId
      await this.verifyRole({ roleNameAgent: updatedByRoleName, roleIdTarget })

      return this.sharedUserRepository.update({ id, deletedAt: null }, { ...data, updatedById })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException(`User with id ${id} not found`)
      }
      if (isForeignKeyConstraintPrismaError(error)) {
        throw new NotFoundException(`Role with id ${data.roleId} not found`)
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw new ForbiddenException('Email already exists')
      }
      throw error
    }
  }

  async delete({ id, deletedById, deletedByRoleName }: { id: number; deletedById: number; deletedByRoleName: string }) {
    try {
      // cannot delete oneself
      if (id === deletedById) {
        throw new ForbiddenException('You cannot delete yourself')
      }

      const currentUser = await this.findById(id)
      const roleIdTarget = currentUser.roleId
      await this.verifyRole({ roleNameAgent: deletedByRoleName, roleIdTarget })
      await this.userRepo.delete({ id, deletedById })
      return { message: `User with id ${id} deleted successfully` }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException(`User with id ${id} not found`)
      }
      throw error
    }
  }
}
