import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CancelOrderBodyDto,
  CancelOrderResDto,
  CreateOrderBodyDto,
  CreateOrderResDto,
  GetOrderDetailResDto,
  GetOrderListQueryDto,
  GetOrderListRestDto,
  GetOrderParamsDto,
} from 'src/routes/order/order.dto'
import { OrderService } from 'src/routes/order/order.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ZodSerializerDto(GetOrderListRestDto)
  getOrders(@ActiveUser('userId') userId: number, @Query() query: GetOrderListQueryDto) {
    return this.orderService.list(userId, query)
  }

  @Post()
  @ZodSerializerDto(CreateOrderResDto)
  create(@ActiveUser('userId') userId: number, @Body() body: CreateOrderBodyDto) {
    return this.orderService.create(userId, body)
  }

  @Get(':orderId')
  @ZodSerializerDto(GetOrderDetailResDto)
  detail(@ActiveUser('userId') userId: number, @Param() params: GetOrderParamsDto) {
    return this.orderService.detail(userId, params.orderId)
  }

  @Put(':orderId')
  @ZodSerializerDto(CancelOrderResDto)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cancel(@ActiveUser('userId') userId: number, @Param() params: GetOrderParamsDto, @Body() _: CancelOrderBodyDto) {
    return this.orderService.cancel(userId, params.orderId)
  }
}
