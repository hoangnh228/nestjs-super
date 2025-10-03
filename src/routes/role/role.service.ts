import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateRoleBodyType, GetRolesQueryType, UpdateRoleBodyType } from 'src/routes/role/role.model'
import { RoleRepo } from 'src/routes/role/role.repo'
import { ROLES } from 'src/shared/constants/role.constants'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepo: RoleRepo) {}

  async list(pagination: GetRolesQueryType) {
    return await this.roleRepo.list(pagination)
  }

  async findById(id: number) {
    const role = await this.roleRepo.findById(id)
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    return role
  }

  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: number }) {
    try {
      return await this.roleRepo.create({ data, createdById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Role already exists')
      }
      throw error
    }
  }

  private async verifyRole(id: number) {
    const role = await this.roleRepo.findById(id)
    if (!role) {
      throw new NotFoundException('Role not found')
    }

    const baseRoles: string[] = [ROLES.ADMIN, ROLES.CLIENT, ROLES.SELLER]
    if (baseRoles.includes(role.name)) {
      throw new ForbiddenException()
    }
  }

  async update({ id, data, updatedById }: { id: number; data: UpdateRoleBodyType; updatedById: number }) {
    try {
      await this.verifyRole(id)
      return await this.roleRepo.update({ id, data, updatedById })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Role not found')
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Role already exists')
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.verifyRole(id)
      await this.roleRepo.delete({ id, deletedById })
      return { message: 'Role deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Role not found')
      }
      throw error
    }
  }
}
