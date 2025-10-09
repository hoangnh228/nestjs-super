import { Injectable } from '@nestjs/common'
import {
  CreateOrderBodyType,
  CreateOrderResType,
  GetOrderListQueryType,
  GetOrderListResType,
} from 'src/routes/order/order.model'
import { OrderRepo } from 'src/routes/order/order.repo'

@Injectable()
export class OrderService {
  constructor(private readonly orderRepo: OrderRepo) {}

  async list(userId: number, query: GetOrderListQueryType): Promise<GetOrderListResType> {
    return this.orderRepo.list(userId, query)
  }

  async create(userId: number, body: CreateOrderBodyType): Promise<CreateOrderResType> {
    return this.orderRepo.create(userId, body)
  }

  async detail(userId: number, orderId: number) {
    return this.orderRepo.detail(userId, orderId)
  }

  async cancel(userId: number, orderId: number) {
    return this.orderRepo.cancel(userId, orderId)
  }
}
