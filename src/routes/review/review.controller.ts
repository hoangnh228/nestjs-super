import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateReviewBodyDto,
  CreateReviewResDto,
  GetReviewDetailParamsDto,
  GetReviewsDto,
  GetReviewsParamsDto,
  UpdateReviewBodyDto,
} from 'src/routes/review/review.dto'
import { ReviewService } from 'src/routes/review/review.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { PaginationQueryDto } from 'src/shared/dto/request.dto'

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @IsPublic()
  @Get('/products/:productId')
  @ZodSerializerDto(GetReviewsDto)
  getReviews(@Param() params: GetReviewsParamsDto, @Query() query: PaginationQueryDto) {
    return this.reviewService.list(params.productId, query)
  }

  @Post()
  @ZodSerializerDto(CreateReviewResDto)
  createReview(@Body() body: CreateReviewBodyDto, @ActiveUser('userId') userId: number) {
    return this.reviewService.create(userId, body)
  }

  @Put('/:reviewId')
  @ZodSerializerDto(UpdateReviewBodyDto)
  updateReview(
    @Body() body: UpdateReviewBodyDto,
    @Param() params: GetReviewDetailParamsDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.reviewService.update(userId, params.reviewId, body)
  }
}
