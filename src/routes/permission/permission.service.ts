import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { Cache } from 'cache-manager'
import {
  CreatePermissionBodyType,
  GetPermissionQueryType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { PermissionRepo } from 'src/routes/permission/permission.repo'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepo: PermissionRepo,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async list(pagination: GetPermissionQueryType) {
    return await this.permissionRepo.list(pagination)
  }

  async findById(id: number) {
    const permission = await this.permissionRepo.findById(id)
    if (!permission) {
      throw new NotFoundException('Permission not found')
    }
    return permission
  }

  async create({ data, createdById }: { data: CreatePermissionBodyType; createdById: number }) {
    try {
      return await this.permissionRepo.create({ createdById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Permission already exists')
      }
      throw error
    }
  }

  async update({ id, data, updatedById }: { id: number; data: UpdatePermissionBodyType; updatedById: number }) {
    try {
      const permission = await this.permissionRepo.update({ id, data, updatedById })
      await this.deleteCachedRole(permission.roles)
      return permission
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Permission not found')
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Permission already exists')
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      const permission = await this.permissionRepo.delete({ id, deletedById })
      await this.deleteCachedRole(permission.roles)
      return { message: 'Permission deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Permission not found')
      }
      throw error
    }
  }

  deleteCachedRole(roles: { id: number }[]) {
    return Promise.all(
      roles.map((role) => {
        const cacheKey = `role:${role.id}`
        return this.cacheManager.del(cacheKey)
      }),
    )
  }
}
