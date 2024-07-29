import { Injectable, Inject } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ItemDto } from 'shared/dtos/item.dto';
import { Order } from './schemas/order.schema';
import { CartDocument } from './schemas/cart.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Injectable()
export class OrdersService {
  constructor(
    private cartRepository: CartRepository,
    @InjectModel(Order.name) private orderModel: mongoose.Model<Order>,
    @Inject('PRODUCTSMS') private productsClient: ClientProxy,
  ) {}

  async createCart(
    userId: string,
    item: ItemDto,
    subTotalPrice: number,
    totalPrice: number,
  ) {
    const product: any = await this.productsClient
      .send({ cmd: 'getProduct' }, item.productId)
      .toPromise();

    if (product.stock < item.quantity) {
      throw new RpcException('Required quantity not available');
    }

    return this.cartRepository.createCart(userId, [item], totalPrice);
  }

  async getCart(userId: string) {
    return this.cartRepository.findCartByUserId(userId);
  }

  async deleteCart(userId: string) {
    return this.cartRepository.deleteCartByUserId(userId);
  }

  async addItemToCart(userId: string, item: ItemDto) {
    const product: any = await this.productsClient
      .send({ cmd: 'getProduct' }, item.productId)
      .toPromise();

    if (product.stock < item.quantity) {
      throw new RpcException('Required quantity not available');
    }

    const cart = await this.getCart(userId);

    if (cart) {
      const itemIdx = cart.items.findIndex(
        (i) => i.productId.toString() === item.productId,
      );

      if (itemIdx > -1) {
        const myItem = cart.items[itemIdx];
        myItem.quantity += item.quantity;
        myItem.subtotal = myItem.quantity * product.rating;
        cart.items[itemIdx] = myItem;
      } else {
        cart.items.push({
          ...item,
          subtotal: product.rating * item.quantity,
        });
      }

      await this.recalCart(cart);
      return this.cartRepository.updateCart(cart);
    } else {
      return this.createCart(
        userId,
        item,
        product.rating * item.quantity,
        product.rating * item.quantity,
      );
    }
  }

  async removeItemFromCart(userId: string, productId: string) {
    const cart = await this.getCart(userId);

    const itemIdx = cart.items.findIndex(
      (i) => i.productId.toString() === productId,
    );

    if (itemIdx > -1) {
      cart.items.splice(itemIdx, 1);
      await this.recalCart(cart);
      return this.cartRepository.updateCart(cart);
    }
  }

  async findOrder(userId: string, id: string): Promise<Order> {
    return await this.orderModel.findOne({ _id: id, userId: userId });
  }
  async createOrder(userId: string): Promise<Order> {
    const session = await this.orderModel.startSession();
    session.startTransaction();
    try {
      const cart = await this.cartRepository.findCartByUserId(userId);

      if (!cart) {
        throw new RpcException('Cart empty');
      }
      if (cart.items.length === 0) {
        throw new RpcException('Cart empty');
      }

      const order = new this.orderModel({
        userId: cart.userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
      });

      await order.save({ session });

      cart.items.forEach(async (item) => {
        const productRequired = await this.productsClient
          .send({ cmd: 'getProduct' }, item.productId)
          .toPromise();

        productRequired.stock -= item.quantity;

        const product = {
          name: productRequired.name,
          author: productRequired.author,
          rating: productRequired.rating,
          category: productRequired.category,
          stock: productRequired.stock,
        };
        const id = item.productId;
        const data = { id, product };
        await this.productsClient
          .send({ cmd: 'updateProduct' }, data)
          .toPromise();
      });

      await this.deleteCart(userId);

      await session.commitTransaction();

      return await order.populate({ path: 'userId', model: 'User' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelOrder(userId: string, id: string) {
    const session = await this.orderModel.startSession();
    session.startTransaction();
    try {
      const existingOrder = await this.findOrder(userId, id);

      if (!existingOrder) {
        throw new RpcException('No Order Exists');
      }

      if (existingOrder.status === 'Cancelled') {
        throw new RpcException('Order Already Cancelled');
      }
      const cancelledOrder = await this.orderModel
        .findOneAndUpdate(
          { userId: userId, _id: id },
          {
            userId: existingOrder.userId,
            items: existingOrder.items,
            totalPrice: existingOrder.totalPrice,
            status: 'Cancelled',
          },
          { new: true, session },
        )
        .exec();

      existingOrder.items.forEach(async (item) => {
        const productRequired = await this.productsClient
          .send({ cmd: 'getProduct' }, item.productId)
          .toPromise();

        productRequired.stock -= item.quantity;

        const product = {
          name: productRequired.name,
          author: productRequired.author,
          rating: productRequired.rating,
          category: productRequired.category,
          stock: productRequired.stock,
        };
        const id = item.productId;
        const data = { id, product };
        await this.productsClient
          .send({ cmd: 'updateProduct' }, data)
          .toPromise();
      });

      await session.commitTransaction();

      return cancelledOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  private async recalCart(cart: CartDocument) {
    cart.totalPrice = 0;
    for (const item of cart.items) {
      const product: any = await this.productsClient
        .send({ cmd: 'getProduct' }, item.productId.toString())
        .toPromise();
      cart.totalPrice += item.quantity * product.rating;
    }
    return cart.save();
  }
}
