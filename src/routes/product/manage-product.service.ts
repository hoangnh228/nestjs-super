import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import {
  CreateProductBodyType,
  GetManageProductsQueryType,
  UpdateProductBodyType,
} from 'src/routes/product/product.model'
import { ProductRepo } from 'src/routes/product/product.repo'
import { ROLES } from 'src/shared/constants/role.constants'
import { isNotFoundPrismaError } from 'src/shared/helpers'

@Injectable()
export class ManageProductService {
  constructor(private productRepo: ProductRepo) {}

  // check is not admin or owner. not allow to access
  validatePrivilege({
    userIdRequest,
    roleNameRequest,
    createdById,
  }: {
    userIdRequest: number
    roleNameRequest: string
    createdById: number | undefined | null
  }) {
    if (userIdRequest !== createdById && roleNameRequest !== ROLES.ADMIN) {
      throw new ForbiddenException('You do not have permission to access this resource')
    }
    return true
  }

  // createdById is required for product list of a seller
  list(props: { query: GetManageProductsQueryType; userIdRequest: number; roleNameRequest?: string }) {
    this.validatePrivilege({
      userIdRequest: props.userIdRequest,
      roleNameRequest: props.roleNameRequest || '',
      createdById: props.query.createdById,
    })
    return this.productRepo.list({
      page: props.query.page,
      limit: props.query.limit,
      languageId: I18nContext.current()?.lang as string,
      createdById: props.query.createdById,
      isPublic: props.query.isPublic,
      name: props.query.name,
      brandIds: props.query.brandIds,
      categories: props.query.categories,
      minPrice: props.query.minPrice,
      maxPrice: props.query.maxPrice,
      orderBy: props.query.orderBy,
      sortBy: props.query.sortBy,
    })
  }

  async getDetail(props: { productId: number; userIdRequest: number; roleNameRequest: string }) {
    const product = await this.productRepo.getDetail({
      productId: props.productId,
      languageId: I18nContext.current()?.lang as string,
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    this.validatePrivilege({
      userIdRequest: props.userIdRequest,
      roleNameRequest: props.roleNameRequest,
      createdById: product.createdById,
    })

    return product
  }

  create({ data, createdById }: { data: CreateProductBodyType; createdById: number }) {
    return this.productRepo.create({ data, createdById })
  }

  async update({
    productId,
    data,
    updatedById,
    roleNameRequest,
  }: {
    productId: number
    data: UpdateProductBodyType
    updatedById: number
    roleNameRequest: string
  }) {
    const product = await this.productRepo.findById(productId)
    if (!product) {
      throw new NotFoundException('Product not found')
    }

    this.validatePrivilege({
      userIdRequest: updatedById,
      roleNameRequest,
      createdById: product.createdById,
    })

    try {
      return this.productRepo.update(productId, updatedById, data)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Product not found')
      }
      throw error
    }
  }

  async delete(
    { productId, deletedById, roleNameRequest }: { productId: number; deletedById: number; roleNameRequest: string },
    isHard?: boolean,
  ) {
    const product = await this.productRepo.findById(productId)
    if (!product) {
      throw new NotFoundException('Product not found')
    }

    this.validatePrivilege({
      userIdRequest: deletedById,
      roleNameRequest,
      createdById: product.createdById,
    })

    try {
      await this.productRepo.delete(productId, deletedById, isHard)
      return { message: 'Product deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Product not found')
      }
      throw error
    }
  }
}
