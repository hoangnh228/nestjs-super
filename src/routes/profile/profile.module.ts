import { Module } from '@nestjs/common'
import { ProfileController } from 'src/routes/profile/profile.controller'
import { ProfileService } from 'src/routes/profile/profile.service'
import { SharedModule } from 'src/shared/shared.module'

@Module({
  imports: [SharedModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
