import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Order.name) public orderModel: Model<OrderDocument>,
  ) {}

  async findOrderByIdAndUserId(
    userId: string,
    orderId: string,
  ): Promise<OrderDocument> {
    return this.orderModel.findOne({ _id: orderId, userId }).exec();
  }

  async createOrder(order: Order): Promise<OrderDocument> {
    return (await this.orderModel.create(order)).save();
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<OrderDocument> {
    return this.orderModel
      .findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async deleteOrder(orderId: string): Promise<OrderDocument> {
    return this.orderModel.findByIdAndDelete(orderId).exec();
  }
}
