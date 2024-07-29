import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { ItemDto } from 'shared/dtos/item.dto';

@Injectable()
export class CartRepository {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  async createCart(userId: string, items: ItemDto[], totalPrice: number) {
    return (await this.cartModel.create({ userId, items, totalPrice })).save();
  }

  async findCartByUserId(userId: string): Promise<CartDocument> {
    return this.cartModel.findOne({ userId }).populate('userId').exec();
  }

  async deleteCartByUserId(userId: string): Promise<Cart> {
    return this.cartModel.findOneAndDelete({ userId }).exec();
  }

  async updateCart(cart: CartDocument): Promise<Cart> {
    return this.cartModel
      .findByIdAndUpdate(cart._id, cart, { new: true })
      .exec();
  }
}
