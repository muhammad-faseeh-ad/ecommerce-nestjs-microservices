import { Controller } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { Order } from './schemas/order.schema';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'getCart' })
  async getUserCart(userId: any) {
    return await this.ordersService.getCart(userId);
  }

  @MessagePattern({ cmd: 'addItem' })
  async addItemToCart(data: any) {
    const { userId, item } = data;
    return await this.ordersService.addItemToCart(userId, item);
  }

  @MessagePattern({ cmd: 'removeItem' })
  async removeItemFromCart(data: any) {
    const { userId, productId } = data;

    const cart = await this.ordersService.removeItemFromCart(userId, productId);
    if (!cart) throw new RpcException('Item does not exist');
    return cart;
  }

  @MessagePattern({ cmd: 'deleteCart' })
  async deleteCart(userId: any) {
    await this.ordersService.deleteCart(userId);
  }

  @MessagePattern({ cmd: 'findOrder' })
  async findOrder(data: any): Promise<Order> {
    const { userId, id } = data;
    return await this.ordersService.findOrder(id, userId);
  }

  @MessagePattern({ cmd: 'createOrder' })
  async createOrder(userId: string): Promise<Order> {
    return await this.ordersService.createOrder(userId);
  }

  @MessagePattern({ cmd: 'cancelOrder' })
  async cancelOrder(data: any) {
    const { userId, id } = data;
    return await this.ordersService.cancelOrder(userId, id);
  }
}
