import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { PaymentController } from 'src/routes/payment/payment.controller'
import { PaymentProducer } from 'src/routes/payment/payment.producer'
import { PaymentRepo } from 'src/routes/payment/payment.repo'
import { PaymentService } from 'src/routes/payment/payment.service'
import { PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant'

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepo, PaymentProducer],
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE_NAME,
    }),
  ],
})
export class PaymentModule {}
