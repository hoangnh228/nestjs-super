import { Module } from '@nestjs/common'
import { ManageProductController } from 'src/routes/product/manage-product.controller'
import { ManageProductService } from 'src/routes/product/manage-product.service'
import { ProductController } from 'src/routes/product/product.controller'
import { ProductRepo } from 'src/routes/product/product.repo'
import { ProductService } from 'src/routes/product/product.service'

@Module({
  controllers: [ProductController, ManageProductController],
  providers: [ProductService, ManageProductService, ProductRepo],
})
export class ProductModule {}
