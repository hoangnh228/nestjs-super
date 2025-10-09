import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  AddToCartBodyDto,
  CartItemDto,
  DeleteCartBodyDto,
  GetCartItemParamsDto,
  GetCartResDto,
  UpdateCartItemBodyDto,
} from 'src/routes/cart/cart.dto'
import { CartService } from 'src/routes/cart/cart.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { PaginationQueryDto } from 'src/shared/dto/request.dto'
import { MessageResDto } from 'src/shared/dto/response.dto'

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ZodSerializerDto(GetCartResDto)
  getCart(@ActiveUser('userId') userId: number, @Query() query: PaginationQueryDto) {
    return this.cartService.getCart(userId, query)
  }

  @Post()
  @ZodSerializerDto(CartItemDto)
  addToCart(@Body() body: AddToCartBodyDto, @ActiveUser('userId') userId: number) {
    return this.cartService.addToCart(userId, body)
  }

  @Put(':cartItemId')
  @ZodSerializerDto(CartItemDto)
  updateCartItem(
    @Param() params: GetCartItemParamsDto,
    @Body() body: UpdateCartItemBodyDto,
    @ActiveUser('userId') userId: number,
  ) {
    return this.cartService.updateCartItem({ cartItemId: params.cartItemId, body, userId })
  }

  @Post('delete')
  @ZodSerializerDto(MessageResDto)
  deleteCartItems(@ActiveUser('userId') userId: number, @Body() body: DeleteCartBodyDto) {
    return this.cartService.deleteCartItems(userId, body)
  }
}
