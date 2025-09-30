import { Module } from '@nestjs/common'
import { RoleController } from 'src/routes/role/role.controller'
import { RoleService } from 'src/routes/role/role.service'
import { RoleRepo } from 'src/routes/role/role.repo'

@Module({
  controllers: [RoleController],
  providers: [RoleService, RoleRepo],
})
export class RoleModule {}
