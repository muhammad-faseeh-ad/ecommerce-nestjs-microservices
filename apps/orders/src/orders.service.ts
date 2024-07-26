import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import mongoose from 'mongoose';
import { Order } from './schemas/order.schema';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ItemDto } from 'shared/dtos/item.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Cart.name) private CartModel: mongoose.Model<CartDocument>,
    @InjectModel(Order.name) private orderModel: mongoose.Model<Order>,
    @Inject('PRODUCTSMS') private productsClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello World! From Orders';
  }

  async createCart(
    userId: string,
    item: ItemDto,
    subTotalPrice: number,
    totalPrice: number,
  ) {
    const { productId, quantity } = item;

    const product: any = await this.productsClient.send(
      { cmd: 'getProduct' },
      productId,
    );
    if (product.stock < quantity) {
      throw new RpcException('Required quantity not avialable');
    }
    return (
      await this.CartModel.create({
        userId,
        items: [{ ...item, subTotalPrice }],
        totalPrice,
      })
    ).save();
  }

  async getCart(userId: string): Promise<CartDocument> {
    const cart = await this.CartModel.findOne({ userId: userId }).populate({
      path: 'userId',
      model: 'User',
    });

    return cart;
  }

  async deleteCart(userId: string): Promise<Cart> {
    const cart = await this.CartModel.findOneAndDelete({ userId: userId });
    return cart;
  }

  async recalCart(cart: CartDocument) {
    cart.totalPrice = 0;
    cart.items.forEach(async (item) => {
      const product: any = this.productsClient.send(
        { cmd: 'getProduct' },
        item.productId.toString(),
      );

      cart.totalPrice += item.quantity * product.rating;
    });
  }

  async addItemToCart(userid: string, item: ItemDto): Promise<Cart> {
    const { productId, quantity } = item;

    const product: any = await this.productsClient
      .send({ cmd: 'getProduct' }, productId)
      .toPromise();

    if (product.stock < quantity) {
      throw new RpcException('Required quantity not avialable');
    }

    const subtotal = product.rating * quantity;

    const cart = await this.getCart(userid);

    if (cart) {
      const itemIdx = cart.items.findIndex(
        (item) => item.productId.toString() == productId,
      );

      if (itemIdx > -1) {
        const myitem = cart.items[itemIdx];
        myitem.quantity = Number(myitem.quantity) + Number(quantity);
        myitem.subtotal = myitem.quantity * product.rating;

        cart.items[itemIdx] = myitem;
        this.recalCart(cart);
        return cart.save();
      } else {
        cart.items.push({ ...item, subtotal });
        this.recalCart(cart);
        return cart.save();
      }
    } else {
      const newCart = await this.createCart(userid, item, subtotal, subtotal);
      product.stock -= quantity;
      return newCart;
    }
  }

  async removeItemFromCart(userid: string, pid: string): Promise<any> {
    const cartt = await this.getCart(userid);

    const itemIdx = cartt.items.findIndex(
      (item) => item.productId.toString() == pid,
    );

    if (itemIdx > -1) {
      cartt.items.splice(itemIdx, 1);
      this.recalCart(cartt);
      return cartt.save();
    }
  }

  async findOrder(userId: string, id: string): Promise<Order> {
    return await this.orderModel.findOne({ _id: id, userId: userId });
  }
  async createOrder(userId: string): Promise<Order> {
    const session = await this.orderModel.startSession();
    session.startTransaction();
    try {
      const cart = await this.CartModel.findOne({ userId: userId })
        .session(session)
        .exec();

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
}
