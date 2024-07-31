import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ItemDto } from 'shared/dtos/item.dto';
import { Order } from './schemas/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import Redis from 'ioredis';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: mongoose.Model<Order>,
    @Inject('PRODUCTSMS') private productsClient: ClientProxy,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
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

    const cart = { userId, items: [item], totalPrice };
    await this.redisClient.set(`cart:${userId}`, JSON.stringify(cart));
    await this.redisClient.expire(`cart:${userId}`, 600);

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.redisClient.get(`cart:${userId}`);
    return cart ? JSON.parse(cart) : null;
  }

  async deleteCart(userId: string) {
    await this.redisClient.del(`cart:${userId}`);
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
      await this.redisClient.set(`cart:${userId}`, JSON.stringify(cart));
      return cart;
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
      await this.redisClient.set(`cart:${userId}`, JSON.stringify(cart));
      return cart;
    }
  }

  async findOrder(userId: string, id: string): Promise<Order> {
    return await this.orderModel.findOne({ _id: id, userId: userId });
  }

  async createOrder(userId: string): Promise<Order> {
    const session = await this.orderModel.startSession();
    session.startTransaction();
    try {
      const cart = await this.getCart(userId);

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

      return await cancelledOrder.populate({ path: 'userId', model: 'User' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async recalCart(cart) {
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.subtotal, 0);
  }
}
