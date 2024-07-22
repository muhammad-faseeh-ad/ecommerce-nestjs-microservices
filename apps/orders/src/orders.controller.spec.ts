import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartDocument } from './schemas/cart.schema';
import mongoose from 'mongoose';
import { ItemDto } from 'shared/dtos/item.dto';
import { RpcException } from '@nestjs/microservices';

describe('OrdersController', () => {
  let ordersController: OrdersController;
  let ordersService: OrdersService;

  const mockOrdersService = {
    getHello: jest.fn().mockReturnValue('Hello World! From Orders'),
    getCart: jest.fn(),
    addItemToCart: jest.fn(),
    removeItemFromCart: jest.fn(),
    deleteCart: jest.fn(),
    findOrder: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
  };
  const mockCart: Partial<CartDocument> = {
    _id: '609a2f6c9c857b12345abcde',
    userId: new mongoose.Types.ObjectId(1234),
    items: [],
    totalPrice: 0,
    save: jest.fn(),
  };

  const mockItem: ItemDto = {
    productId: '609a2f6c9c857b12345abcdef',
    quantity: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    ordersController = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(ordersController.getHello()).toBe('Hello World! From Orders');
    });
  });

  describe('getUserCart', () => {
    it('should return user cart', async () => {
      const userId = '1234';
      jest.spyOn(ordersService, 'getCart').mockResolvedValue(mockCart as any);
      expect(await ordersController.getUserCart(userId)).toBe(mockCart);
    });
  });

  describe('addItemToCart', () => {
    it('should add item to cart', async () => {
      const data = { userId: '60f9b7d93a57c82aef5a7a67', item: mockItem };
      jest
        .spyOn(ordersService, 'addItemToCart')
        .mockResolvedValue(mockCart as any);
      expect(await ordersController.addItemToCart(data)).toBe(mockCart);
    });
  });

  describe('removeItemFromCart', () => {
    it('should remove item from cart', async () => {
      const data = {
        userId: '60f9b7d93a57c82aef5a7a67',
        productId: '609a2f6c9c857b12345abcdef',
      };
      jest
        .spyOn(ordersService, 'removeItemFromCart')
        .mockResolvedValue(mockCart);
      expect(await ordersController.removeItemFromCart(data)).toBe(mockCart);
    });

    it('should throw RpcException if item does not exist', async () => {
      const data = {
        userId: '60f9b7d93a57c82aef5a7a67',
        productId: '609a2f6c9c857b12345abcdef',
      };
      jest.spyOn(ordersService, 'removeItemFromCart').mockResolvedValue(null);
      await expect(ordersController.removeItemFromCart(data)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('deleteCart', () => {
    it('should delete cart', async () => {
      const userId = '60f9b7d93a57c82aef5a7a67';
      jest
        .spyOn(ordersService, 'deleteCart')
        .mockResolvedValue(mockCart as any);
      expect(await ordersController.deleteCart(userId)).toBe(mockCart);
    });

    it('should throw RpcException if cart does not exist', async () => {
      const userId = '60f9b7d93a57c82aef5a7a67';
      jest.spyOn(ordersService, 'deleteCart').mockResolvedValue(null);

      await expect(ordersController.deleteCart(userId)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('findOrder', () => {
    it('should find order', async () => {
      const data = {
        userId: '60f9b7d93a57c82aef5a7a67',
        id: '609a2f6c9c857b12345abcdef',
      };
      const mockOrder = {
        _id: data.id,
        userId: new mongoose.Types.ObjectId(data.userId),
        items: [
          {
            productId: 'product123',
            quantity: 2,
            subtotal: 20, // Include subtotal
          },
          {
            productId: 'otherProductId',
            quantity: 1,
            subtotal: 10, // Include subtotal
          },
        ],
        totalPrice: 30,
        status: 'Confirmed',
      };
      jest
        .spyOn(ordersService, 'findOrder')
        .mockResolvedValue(mockOrder as any);
      expect(await ordersController.findOrder(data)).toBe(mockOrder);
    });
  });

  describe('createOrder', () => {
    it('should create order', async () => {
      const userId = '60f9b7d93a57c82aef5a7a67';
      const mockOrder = {
        _id: '609a2f6c9c857b12345abcdef',
        userId: new mongoose.Types.ObjectId(userId),
        items: [
          {
            productId: 'product123',
            quantity: 2,
            subtotal: 20, // Include subtotal
          },
          {
            productId: 'otherProductId',
            quantity: 1,
            subtotal: 10, // Include subtotal
          },
        ],
        totalPrice: 30,
        status: 'Confirmed',
      };
      jest
        .spyOn(ordersService, 'createOrder')
        .mockResolvedValue(mockOrder as any);

      expect(await ordersController.createOrder(userId)).toBe(mockOrder);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order', async () => {
      const data = {
        userId: '60f9b7d93a57c82aef5a7a67',
        id: '609a2f6c9c857b12345abcdef',
      };
      const mockOrder = {
        _id: data.id,
        userId: new mongoose.Types.ObjectId(data.userId),
        items: [
          {
            productId: 'product123',
            quantity: 2,
            subtotal: 20, // Include subtotal
          },
        ],
        totalPrice: 20,
        status: 'Confirmed',
        save: jest.fn(),
        populate: jest.fn(),
      };

      const updatedOrder = { ...mockOrder, status: 'Cancelled' };
      jest
        .spyOn(ordersService, 'cancelOrder')
        .mockResolvedValue(updatedOrder as any);

      expect(await ordersController.cancelOrder(data)).toBe(updatedOrder);
    });
  });
});
