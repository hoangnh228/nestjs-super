import { Module } from '@nestjs/common'
import { ReviewController } from 'src/routes/review/review.controller'
import { ReviewRepository } from 'src/routes/review/review.repo'
import { ReviewService } from 'src/routes/review/review.service'

@Module({
  controllers: [ReviewController],
  providers: [ReviewRepository, ReviewService],
})
export class ReviewModule {}
