import { Module } from '@nestjs/common'
import { BrandController } from 'src/routes/brand/brand.controller'
import { BrandRepo } from 'src/routes/brand/brand.repo'
import { BrandService } from 'src/routes/brand/brand.service'

@Module({
  providers: [BrandRepo, BrandService],
  controllers: [BrandController],
})
export class BrandModule {}
