import { Injectable } from '@nestjs/common'
import { CreateOrderBodyType, GetOrderListQueryType, GetOrderListResType } from 'src/routes/order/order.model'
import { OrderProducer } from 'src/routes/order/order.producer'
import { OrderRepo } from 'src/routes/order/order.repo'

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly orderProducer: OrderProducer,
  ) {}

  async list(userId: number, query: GetOrderListQueryType): Promise<GetOrderListResType> {
    return this.orderRepo.list(userId, query)
  }

  create(userId: number, body: CreateOrderBodyType) {
    return this.orderRepo.create(userId, body)
  }

  async detail(userId: number, orderId: number) {
    return this.orderRepo.detail(userId, orderId)
  }

  async cancel(userId: number, orderId: number) {
    return this.orderRepo.cancel(userId, orderId)
  }
}
