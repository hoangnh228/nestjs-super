import { DeleteCartBodyType, UpdateCartItemBodyType } from './cart.model'
import { I18nContext } from 'nestjs-i18n/dist/i18n.context'
import { Injectable } from '@nestjs/common'
import { CartRepo } from 'src/routes/cart/cart.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { AddToCartBodyType } from 'src/routes/cart/cart.model'

@Injectable()
export class CartService {
  constructor(private readonly cartRepo: CartRepo) {}

  getCart(userId: number, query: PaginationQueryType) {
    // return this.cartRepo.list({
    //   userId,
    //   languageId: I18nContext.current()?.lang as string,
    //   page: query.page,
    //   limit: query.limit,
    // })

    return this.cartRepo.list2({
      userId,
      languageId: I18nContext.current()?.lang as string,
      page: query.page,
      limit: query.limit,
    })
  }

  addToCart(userId: number, body: AddToCartBodyType) {
    return this.cartRepo.addToCart(userId, body)
  }

  updateCartItem({ cartItemId, body, userId }: { cartItemId: number; body: UpdateCartItemBodyType; userId: number }) {
    return this.cartRepo.updateCartItem({ cartItemId, body, userId })
  }

  async deleteCartItems(userId: number, body: DeleteCartBodyType) {
    const { count } = await this.cartRepo.deleteCartItems(userId, body)
    return { message: `${count} item(s) removed from cart` }
  }
}
