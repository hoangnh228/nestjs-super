import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  AddToCartBodyType,
  CartItemDetailType,
  CartItemType,
  DeleteCartBodyType,
  GetCartResType,
  UpdateCartItemBodyType,
} from 'src/routes/cart/cart.model'
import { ALL_LANGUAGE_CODE } from 'src/shared/constants/other.constant'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { SKUSchemaType } from 'src/shared/models/shared-sku.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class CartRepo {
  constructor(private readonly prismaService: PrismaService) {}

  private async validateSku({
    skuId,
    quantity,
    userId,
    isCreate,
  }: {
    skuId: number
    quantity: number
    userId: number
    isCreate: boolean
  }): Promise<SKUSchemaType> {
    const [cartItem, sku] = await Promise.all([
      this.prismaService.cartItem.findUnique({
        where: {
          userId_skuId: { userId, skuId },
        },
      }),
      this.prismaService.sKU.findUnique({
        where: { id: skuId, deletedAt: null },
        include: { product: true },
      }),
    ])

    if (!sku) throw new NotFoundException('SKU not found')
    if (!cartItem) throw new NotFoundException('Cart item not found')
    if (isCreate && quantity + cartItem.quantity > sku.stock) throw new BadRequestException('Invalid quantity')

    if (sku.stock < 1 || sku.stock < quantity) throw new BadRequestException('SKU out of stock')

    const { product } = sku
    if (
      product.deletedAt !== null ||
      product.publishedAt === null ||
      (product.publishedAt !== null && product.publishedAt > new Date())
    ) {
      throw new Error('Product not available')
    }

    return sku
  }

  async list({
    userId,
    languageId,
    page,
    limit,
  }: {
    userId: number
    languageId: string
    page: number
    limit: number
  }): Promise<GetCartResType> {
    const cartItems = await this.prismaService.cartItem.findMany({
      where: {
        userId,
        sku: {
          product: {
            deletedAt: null,
            publishedAt: {
              lte: new Date(),
              not: null,
            },
          },
        },
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                productTranslations: {
                  where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
                },
                createdBy: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const groupMap = new Map<number, CartItemDetailType>()
    for (const item of cartItems) {
      const shopId = item.sku.product.createdById
      if (shopId) {
        if (!groupMap.has(shopId)) {
          groupMap.set(shopId, { shop: item.sku.product.createdBy, cartItems: [] })
        }
        groupMap.get(shopId)?.cartItems.push(item)
      }
    }

    const sortedGroups = Array.from(groupMap.values())
    const skip = (page - 1) * limit
    const take = limit
    const totalGroups = sortedGroups.length
    const pagedGroups = sortedGroups.slice(skip, skip + take)

    return {
      data: pagedGroups,
      totalItems: totalGroups,
      page,
      limit,
      totalPages: Math.ceil(totalGroups / limit),
    }
  }

  async list2({
    userId,
    limit,
    page,
    languageId,
  }: {
    userId: number
    limit: number
    page: number
    languageId: string
  }): Promise<GetCartResType> {
    const skip = (page - 1) * limit
    const take = limit

    // count total items
    const totalItems$ = this.prismaService.$queryRaw<{ createdById: number }[]>`
        SELECT "Product"."createdById"
        FROM "CartItem"
        JOIN "SKU" ON "CartItem"."skuId" = "SKU"."id"
        JOIN "Product" ON "SKU"."productId" = "Product"."id"
        WHERE "CartItem"."userId" = ${userId}
          AND "Product"."deletedAt" IS NULL
          AND "Product"."publishedAt" IS NOT NULL
          AND "Product"."publishedAt" <= NOW()
        GROUP BY "Product"."createdById"
        `
    const data$ = this.prismaService.$queryRaw<CartItemDetailType[]>`
        SELECT "Product"."createdById",
          json_agg(
            json_build_object(
              'id', "CartItem"."id",
              'quantity', "CartItem"."quantity",
              'skuId', "CartItem"."skuId",
              'userId', "CartItem"."userId",
              'createdAt', "CartItem"."createdAt",
              'updatedAt', "CartItem"."updatedAt",
              'sku', json_build_object(
                'id', "SKU"."id",
                'value', "SKU"."value",
                'price', "SKU"."price",
                'stock', "SKU"."stock",
                'image', "SKU"."image",
                'productId', "SKU"."productId",
                'product', json_build_object(
                  'id', "Product"."id",
                  'publishedAt', "Product"."publishedAt",
                  'name', "Product"."name",
                  'basePrice', "Product"."basePrice",
                  'virtialPrice', "Product"."virtualPrice",
                  'brandId', "Product"."brandId",
                  'images', "Product"."images",
                  'variants', "Product"."variants",
                  'productTranslations', COALESCE(
                    (
                      SELECT json_agg(
                        json_build_object(
                          'id', pt."id",
                          'productId', pt."productId",
                          'languageId', pt."languageId",
                          'name', pt."name",
                          'description', pt."description",
                        )
                      ) FILTER (WHERE pt."id" IS NOT NULL)
                      FROM "ProductTranslation" pt
                      WHERE pt."productId" = "Product"."id"
                        AND pt."deletedAt" IS NULL
                        ${languageId === ALL_LANGUAGE_CODE ? Prisma.sql`` : Prisma.sql`AND pt."languageId" = ${languageId}`}
                    ), '[]'::json
                  )
                )
              )
            ) ORDER BY "CartItem"."updatedAt" DESC
          ) AS "cartItems",
          json_build_object(
            'id', "User"."id",
            'name', "User"."name",
            'avatar', "User"."avatar"
          ) AS "shop"
        FROM "CartItem"
          JOIN "SKU" ON "CartItem"."skuId" = "SKU"."id"
          JOIN "Product" ON "SKU"."productId" = "Product"."id"
          LEFT JOIN "ProductTranslation" ON "Product"."id" = "ProductTranslation"."productId"
            AND "ProductTranslation"."deletedAt" IS NULL
            ${languageId === ALL_LANGUAGE_CODE ? Prisma.sql`` : Prisma.sql`AND "ProductTranslation"."languageId" = ${languageId}`}
          LEFT JOIN "User" ON "Product"."createdById" = "User"."id"
        WHERE "CartItem"."userId" = ${userId}
          AND "Product"."deletedAt" IS NULL
          AND "Product"."publishedAt" IS NOT NULL
          AND "Product"."publishedAt" <= NOW()
        GROUP BY "Product"."createdById", "User"."id"
        ORDER BY MAX("CartItem"."updatedAt") DESC
        LIMIT ${take}
        OFFSET ${skip}
      `
    const [totalItems, data] = await Promise.all([totalItems$, data$])

    return {
      data,
      totalItems: totalItems.length,
      page,
      limit,
      totalPages: Math.ceil(totalItems.length / limit),
    }
  }

  async addToCart(userId: number, body: AddToCartBodyType): Promise<CartItemType> {
    await this.validateSku({ skuId: body.skuId, quantity: body.quantity, userId, isCreate: true })
    return this.prismaService.cartItem.upsert({
      where: { userId_skuId: { userId, skuId: body.skuId } },
      update: { quantity: { increment: body.quantity } },
      create: { userId, skuId: body.skuId, quantity: body.quantity },
    })
  }

  async updateCartItem({
    cartItemId,
    body,
    userId,
  }: {
    cartItemId: number
    body: UpdateCartItemBodyType
    userId: number
  }): Promise<CartItemType> {
    await this.validateSku({ skuId: body.skuId, quantity: body.quantity, userId, isCreate: false })
    return this.prismaService.cartItem
      .update({
        where: { id: cartItemId, userId },
        data: { skuId: body.skuId, quantity: body.quantity },
      })
      .catch((error) => {
        if (isNotFoundPrismaError(error)) {
          throw new NotFoundException('Cart item not found')
        }
        throw error
      })
  }

  async deleteCartItems(userId: number, body: DeleteCartBodyType): Promise<{ count: number }> {
    return this.prismaService.cartItem.deleteMany({
      where: { id: { in: body.cartItemIds }, userId },
    })
  }
}
