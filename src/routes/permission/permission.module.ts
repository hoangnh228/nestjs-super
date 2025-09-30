import { Module } from '@nestjs/common'
import { PermissionController } from 'src/routes/permission/permission.controller'
import { PermissionService } from 'src/routes/permission/permission.service'
import { PermissionRepo } from 'src/routes/permission/permission.repo'

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepo],
})
export class PermissionModule {}
