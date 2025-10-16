import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateReviewBodyType,
  CreateReviewResType,
  GetReviewsType,
  UpdateReviewBodyType,
  UpdateReviewResType,
} from 'src/routes/review/review.model'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class ReviewRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(productId: number, pagination: PaginationQueryType): Promise<GetReviewsType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const [data, totalItems] = await Promise.all([
      this.prismaService.review.findMany({
        where: { productId },
        include: {
          medias: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.review.count({ where: { productId } }),
    ])

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  private async validateOrder({ orderId, userId }: { orderId: number; userId: number }) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId, userId },
    })

    if (!order) {
      throw new BadRequestException('Order not found or does not belong to the user')
    }
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Cannot review an order that is not delivered')
    }
    return order
  }

  private async validateUpdateReview({ reviewId, userId }: { reviewId: number; userId: number }) {
    const review = await this.prismaService.review.findUnique({
      where: { id: reviewId, userId },
    })

    if (!review) {
      throw new NotFoundException('Review not found or does not belong to the user')
    }
    if (review.updateCount >= 3) {
      throw new BadRequestException('You have reached the maximum number of updates for this review')
    }
    return review
  }

  async create(userId: number, body: CreateReviewBodyType): Promise<CreateReviewResType> {
    const { content, medias, productId, orderId, rating } = body
    await this.validateOrder({ orderId, userId })
    return this.prismaService.$transaction(async (tx) => {
      const review = await tx.review
        .create({
          data: {
            content,
            rating,
            orderId,
            productId,
            userId,
          },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        })
        .catch((error) => {
          if (isUniqueConstraintPrismaError(error)) {
            throw new ConflictException('You have already reviewed this order')
          }
          throw error
        })

      const reviewMedias = await tx.reviewMedia.createManyAndReturn({
        data: (medias || []).map((media) => ({
          url: media.url,
          type: media.type,
          reviewId: review.id,
        })),
      })

      return {
        ...review,
        medias: reviewMedias,
      }
    })
  }

  async update({
    userId,
    reviewId,
    body,
  }: {
    userId: number
    reviewId: number
    body: UpdateReviewBodyType
  }): Promise<UpdateReviewResType> {
    const { content, medias, orderId, productId, rating } = body
    await Promise.all([this.validateOrder({ orderId, userId }), this.validateUpdateReview({ reviewId, userId })])

    return this.prismaService.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: reviewId },
        data: {
          content,
          rating,
          orderId,
          productId,
          userId,
          updateCount: { increment: 1 },
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      })

      await tx.reviewMedia.deleteMany({ where: { reviewId } })
      const reviewMedias = await tx.reviewMedia.createManyAndReturn({
        data: (medias || []).map((media) => ({
          url: media.url,
          type: media.type,
          reviewId: review.id,
        })),
      })

      return {
        ...review,
        medias: reviewMedias,
      }
    })
  }
}
