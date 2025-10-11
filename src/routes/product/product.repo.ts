import {
  CreateProductBodyType,
  GetProductDetailResType,
  GetProductsResType,
  UpdateProductBodyType,
} from 'src/routes/product/product.model'
import { PrismaService } from './../../shared/services/prisma.service'
import { Injectable } from '@nestjs/common'
import { ALL_LANGUAGE_CODE, OrderByType, SortBy, SortByType } from 'src/shared/constants/other.constant'
import { Prisma } from '@prisma/client'
import { ProductType } from 'src/shared/models/shared-product.model'

@Injectable()
export class ProductRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({
    limit,
    page,
    name,
    brandIds,
    categories,
    minPrice,
    maxPrice,
    createdById,
    isPublic,
    languageId,
    orderBy,
    sortBy,
  }: {
    limit: number
    page: number
    name?: string
    brandIds?: number[]
    categories?: number[]
    minPrice?: number
    maxPrice?: number
    createdById?: number
    isPublic?: boolean
    languageId: string
    orderBy: OrderByType
    sortBy: SortByType
  }): Promise<GetProductsResType> {
    const skip = (page - 1) * limit
    const take = limit
    let where: Prisma.ProductWhereInput = {
      deletedAt: null,
      createdById: createdById ? createdById : undefined,
    }

    if (isPublic === true) {
      where.publishedAt = { lte: new Date(), not: null }
    } else if (isPublic === false) {
      where = {
        OR: [
          { ...where, publishedAt: null },
          { ...where, publishedAt: { gt: new Date() } },
        ],
      }
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' }
    }

    if (brandIds && brandIds.length > 0) {
      where.brandId = { in: brandIds }
    }

    if (categories && categories.length > 0) {
      where.categories = { some: { id: { in: categories } } }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = { gte: minPrice, lte: maxPrice }
    }

    let orderByField: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = {
      createdAt: orderBy,
    }

    if (sortBy === SortBy.Price) {
      orderByField = { basePrice: orderBy }
    } else if (sortBy === SortBy.Sale) {
      orderByField = { orders: { _count: orderBy } }
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.product.count({ where }),
      this.prismaService.product.findMany({
        where,
        include: {
          productTranslations: {
            where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
          },
          orders: {
            where: { deletedAt: null, status: 'DELIVERED' },
          },
        },
        orderBy: orderByField,
        skip,
        take,
      }),
    ])

    return {
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  findById(productId: number): Promise<ProductType | null> {
    return this.prismaService.product.findUnique({
      where: { id: productId, deletedAt: null },
    })
  }

  getDetail({
    productId,
    languageId,
    isPublic,
  }: {
    productId: number
    languageId: string
    isPublic?: boolean
  }): Promise<GetProductDetailResType | null> {
    let where: Prisma.ProductWhereUniqueInput = {
      id: productId,
      deletedAt: null,
    }

    if (isPublic === true) {
      where.publishedAt = { lte: new Date(), not: null }
    } else if (isPublic === false) {
      where = {
        ...where,
        OR: [{ publishedAt: null }, { publishedAt: { gt: new Date() } }],
      }
    }

    return this.prismaService.product.findUnique({
      where,
      include: {
        productTranslations: {
          where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
        },
        skus: { where: { deletedAt: null } },
        brand: {
          include: {
            brandTranslations: {
              where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
            },
          },
        },
        categories: {
          where: { deletedAt: null },
          include: {
            categoryTranslations: {
              where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
            },
          },
        },
      },
    })
  }

  create({
    createdById,
    data,
  }: {
    createdById: number
    data: CreateProductBodyType
  }): Promise<GetProductDetailResType> {
    const { skus, categories, ...productData } = data
    return this.prismaService.product.create({
      data: {
        ...productData,
        createdById,
        skus: {
          createMany: { data: skus.map((sku) => ({ ...sku, createdById })) },
        },
        categories: {
          connect: categories.map((categoryId) => ({ id: categoryId })),
        },
      },
      include: {
        productTranslations: { where: { deletedAt: null } },
        skus: { where: { deletedAt: null } },
        brand: { include: { brandTranslations: { where: { deletedAt: null } } } },
        categories: { where: { deletedAt: null }, include: { categoryTranslations: { where: { deletedAt: null } } } },
      },
    })
  }

  async update(id: number, updatedById: number, data: UpdateProductBodyType) {
    // SKU exist in DB but not in request -> soft delete
    // SKU exist in both DB and request -> update
    // SKU not exist in DB but exist in request -> create

    const { skus: dataSkus, categories, ...productData } = data
    // 1. get existing SKUs
    const existingSkus = await this.prismaService.sKU.findMany({
      where: { productId: id, deletedAt: null },
    })

    // 2. find SKUs to delete (existing in DB but not in request)
    const skusToDelete = existingSkus.filter((sku) => dataSkus.every((dataSku) => dataSku.value !== sku.value))
    const skuIdsToDelete = skusToDelete.map((sku) => sku.id)

    // 3. mapping id into data request SKUs
    const skusWithId = dataSkus.map((dataSku) => {
      const existingSku = existingSkus.find((sku) => sku.value === dataSku.value)
      return { ...dataSku, id: existingSku ? existingSku.id : null }
    })

    // 4. find SKUs to update
    const skusToUpdate = skusWithId.filter((sku) => sku.id !== null)

    // 5. find SKUs to create
    const skusToCreate = skusWithId
      .filter((sku) => sku.id === null)
      .map((sku) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: skuId, ...rest } = sku
        return {
          ...rest,
          productId: id,
          createdById: updatedById,
        }
      })

    const [product] = await this.prismaService.$transaction([
      // update product
      this.prismaService.product.update({
        where: { id, deletedAt: null },
        data: {
          ...productData,
          updatedById,
          categories: {
            connect: categories.map((categoryId) => ({ id: categoryId })),
          },
        },
      }),
      // soft delete SKUs
      this.prismaService.sKU.updateMany({
        where: { id: { in: skuIdsToDelete }, deletedAt: null },
        data: { deletedById: updatedById, deletedAt: new Date() },
      }),
      // update SKUs
      ...skusToUpdate.map((sku) =>
        this.prismaService.sKU.update({
          where: { id: sku.id!, deletedAt: null },
          data: {
            value: sku.value,
            price: sku.price,
            image: sku.image,
            stock: sku.stock,
            updatedById,
          },
        }),
      ),
      // create SKUs
      this.prismaService.sKU.createMany({
        data: skusToCreate,
      }),
    ])

    return product
  }

  async delete(id: number, deletedById: number, isHard?: boolean): Promise<ProductType> {
    if (isHard) {
      return this.prismaService.product.delete({ where: { id } })
    }

    const now = new Date()
    const [product] = await Promise.all([
      this.prismaService.product.update({
        where: { id, deletedAt: null },
        data: { deletedById, deletedAt: now },
      }),
      this.prismaService.productTranslation.updateMany({
        where: { productId: id, deletedAt: null },
        data: { deletedById, deletedAt: now },
      }),
      this.prismaService.sKU.updateMany({
        where: { productId: id, deletedAt: null },
        data: { deletedById, deletedAt: now },
      }),
    ])
    return product
  }
}
