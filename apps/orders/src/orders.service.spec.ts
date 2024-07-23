import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getModelToken } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Order } from './schemas/order.schema';
import mongoose, { Model } from 'mongoose';
import { ItemDto } from 'shared/dtos/item.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';

describe(' Test suite', () => {
  let ordersService: OrdersService;
  let cartModel: Model<Cart>;
  let orderModel: Model<Order>;
  let productsClient: ClientProxy;

  const mockCartModel = {
    create: jest.fn(),
    findOneAndDelete: jest.fn(),
  };
  const mockOrderModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const mockProductsClient = {
    send: jest.fn(),
  };

  const mockProduct = {
    _id: '668bd1aca18f8f09532f0b10',
    name: 'M1',
    author: 'S1',
    rating: 11.99,
    category: 'mystery',
    stock: 100,
    createdAt: new Date('2024-07-08T11:46:52.656Z'),
    updatedAt: new Date('2024-07-08T11:46:52.656Z'),
    __v: 0,
  } as any;

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
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Cart.name),
          useValue: mockCartModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: 'PRODUCTSMS',
          useValue: mockProductsClient,
        },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    cartModel = module.get<Model<Cart>>(getModelToken(Cart.name));
    orderModel = module.get<Model<Order>>(getModelToken(Order.name));
    productsClient = module.get<ClientProxy>('PRODUCTSMS');
  });

  describe('createCart', () => {
    it('should create a new cart', async () => {
      const userId = '12345';
      const item: ItemDto = { productId: '1234', quantity: 2 };
      const subTotalPrice = 10;
      const totalPrice = 15;

      jest.spyOn(productsClient, 'send').mockImplementation(() => mockProduct);
      const mockCart = {
        _id: 'mockCartId',
        userId,
        items: [{ ...item, subTotalPrice }],
        totalPrice,
      };
      jest.spyOn(cartModel, 'create').mockImplementation(
        () =>
          ({
            save: jest.fn().mockResolvedValue(mockCart),
          }) as any,
      );

      const result = await ordersService.createCart(
        userId,
        item,
        subTotalPrice,
        totalPrice,
      );

      expect(result).toEqual(mockCart);
      expect(productsClient.send).toHaveBeenCalledWith(
        { cmd: 'getProduct' },
        item.productId,
      );
      expect(cartModel.create).toHaveBeenCalledWith({
        userId,
        items: [{ ...item, subTotalPrice }],
        totalPrice,
      });
    });
  });

  //   describe('addItemToCart', () => {
  //     it('should add item to cart', async () => {
  //       const userId = '12345';
  //       const item: ItemDto = { productId: '1234', quantity: 2 };
  //       const subTotalPrice = 10;
  //       const totalPrice = 15;

  //       jest.spyOn(productsClient, 'send').mockImplementation(() => mockProduct);

  //       const mockCart = {
  //         _id: 'mockCartId',
  //         userId,
  //         items: [{ ...item, subTotalPrice }],
  //         totalPrice,
  //       };

  //       jest.spyOn(productsClient, 'send').mockImplementation(() => mockProduct);

  //     });
  //   });
  // it('addItemToCart should add an item to an existing cart', async () => {
  //     const userId = 'mockUserId';
  //     const item: ItemDto = { productId: 'mockProductId', quantity: 2 };
  //     const mockCart = {
  //       _id: 'mockCartId',
  //       userId,
  //       items: [{ productId: 'mockProductId', quantity: 1 }],
  //       totalPrice: 10,
  //       save: jest.fn(),
  //     };
  //     jest.spyOn(ordersService, 'getCart').mockResolvedValue(mockCart as any);

  //     jest.spyOn(productsClient, 'send').mockImplementation(() => mockProduct);

  //     // Test addItemToCart
  //     await expect(ordersService.addItemToCart(userId, item)).resolves.toEqual(mockCart);

  //     // Verify mocks
  //     expect(ordersService.getCart).toHaveBeenCalledWith(userId);
  //     expect(productsClient.send).toHaveBeenCalledWith({ cmd: 'getProduct' }, item.productId);
  //     expect(mockCart.save).toHaveBeenCalled();
  //   });

  describe('addItemToCart', () => {
    it('should add an item to an existing cart', async () => {
      // Mock getProduct response
      const mockProduct = {
        _id: '609a2f6c9c857b12345abcdef',
        name: 'Test Product',
        rating: 10,
        stock: 5,
      };
      (productsClient.send as jest.Mock).mockReturnValueOnce({
        toPromise: () => Promise.resolve(mockProduct),
      });

      jest
        .spyOn(ordersService, 'getCart')
        .mockResolvedValueOnce(mockCart as any);

      jest.spyOn(mockCart as any, 'save').mockImplementation(() => mockCart);

      // Execute the method and assert
      const result = await ordersService.addItemToCart('user123', mockItem);

      expect(result).toEqual(mockCart);
      expect(mockCart.items.length).toBe(1);
      expect(mockCart.items[0].productId.toString()).toBe(mockItem.productId);
    });

    it('should create a new cart and add an item', async () => {
      const mockProduct = {
        _id: '609a2f6c9c857b12345abcdef',
        name: 'Test Product',
        rating: 10,
        stock: 5,
      };
      (productsClient.send as jest.Mock).mockReturnValueOnce({
        toPromise: () => Promise.resolve(mockProduct),
      });

      jest.spyOn(ordersService, 'getCart').mockResolvedValueOnce(null);

      const mockNewCart = { ...mockCart, _id: 'newCartId' };
      jest
        .spyOn(ordersService, 'createCart')
        .mockResolvedValueOnce(mockNewCart as any);

      const result = await ordersService.addItemToCart('user123', mockItem);

      expect(result).toEqual(mockNewCart);
      expect(mockNewCart.items.length).toBe(1);
      expect(mockNewCart.items[0].productId.toString()).toBe(
        mockItem.productId,
      );
    });

    it('should throw RpcException for insufficient stock', async () => {
      const mockProduct = {
        _id: '609a2f6c9c857b12345abcdef',
        name: 'Test Product',
        rating: 10,
        stock: 1,
      };
      (productsClient.send as jest.Mock).mockReturnValueOnce({
        toPromise: () => Promise.resolve(mockProduct),
      });

      await expect(
        ordersService.addItemToCart('user123', mockItem),
      ).rejects.toThrowError(RpcException);
    });
  });

  describe('removeItemFromCart', () => {
    it('should remove item from cart', async () => {
      const userId = 123;
      const productId = 'product123';

      const mockCart: Partial<CartDocument> = {
        _id: '609a2f6c9c857b12345abcde',
        userId: new mongoose.Types.ObjectId(userId),
        items: [
          { productId: productId, quantity: 2, subtotal: 12 },
          { productId: 'otherProductId', quantity: 1, subtotal: 12 },
        ],
        totalPrice: 20,
        save: jest.fn(),
      };
      jest
        .spyOn(ordersService, 'getCart')
        .mockResolvedValueOnce(mockCart as any);
      jest
        .spyOn(ordersService, 'recalCart')
        .mockImplementationOnce(async () => {});
      jest.spyOn(mockCart, 'save').mockResolvedValue({ ...mockCart } as any);
      const result = await ordersService.removeItemFromCart(
        userId.toString(),
        productId,
      );

      // Assert the result
      expect(result._id).toBe('609a2f6c9c857b12345abcde');
      expect(result.items.length).toBe(1); // One item should be removed
      expect(
        result.items.some((item) => item.productId.toString() === productId),
      ).toBe(false);

      // Verify method calls
      expect(mockCart.items.length).toBe(1); // Item should be removed
      expect(mockCart.save).toHaveBeenCalled();
      expect(ordersService.recalCart).toHaveBeenCalledWith(mockCart);
    });

    it('should not remove an item if it does not exist in the cart', async () => {
      // Mock data
      const userId = 123;
      const pid = 'nonExistingProductId';

      // Mock cart with items
      const mockCart: Partial<CartDocument> = {
        _id: '609a2f6c9c857b12345abcde',
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
        save: jest.fn().mockResolvedValue({} as CartDocument), // Mock save method
      };

      // Mock getCart method
      jest
        .spyOn(ordersService, 'getCart')
        .mockResolvedValueOnce(mockCart as any);

      // Mock recalCart method (if needed)
      jest
        .spyOn(ordersService, 'recalCart')
        .mockImplementationOnce(async () => {});

      // Execute the method
      const result = await ordersService.removeItemFromCart(
        userId.toString(),
        pid,
      );

      expect(result).toBeUndefined(); // No item should be removed

      // Verify method calls
      expect(mockCart.items.length).toBe(2); // No item should be removed
      expect(mockCart.save).not.toHaveBeenCalled();
      expect(ordersService.recalCart).not.toHaveBeenCalled();
    });
  });

  describe('findOrder', () => {
    it('should find the order by userId and orderId', async () => {
      const userId = 123;
      const orderId = 321;
      const mockOrder = {
        _id: 321,
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

      jest.spyOn(orderModel, 'findOne').mockResolvedValue(mockOrder);
      const result = await ordersService.findOrder(
        userId.toString(),
        orderId.toString(),
      );

      expect(result).toEqual(mockOrder);
      expect(orderModel.findOne).toHaveBeenCalledWith({
        _id: orderId.toString(),
        userId: userId.toString(),
      });
    });
  });
  describe('createOrder', () => {
    it('should create a new order', async () => {
      const userId = 123;

      const mockCart: Partial<CartDocument> = {
        _id: '609a2f6c9c857b12345abcde',
        userId: new mongoose.Types.ObjectId(userId),
        items: [{ productId: 'product123', quantity: 2, subtotal: 20 }],
        totalPrice: 20,
        populate: jest.fn(),
      };

      const orderId = 321;
      const mockOrder = {
        _id: orderId,
        userId: new mongoose.Types.ObjectId(userId),
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

      jest.spyOn(ordersService, 'getCart').mockResolvedValue(mockCart as any);
      jest.spyOn(mockOrder as any, 'save').mockImplementation(() => mockOrder);
      (productsClient.send as jest.Mock).mockReturnValue({
        toPromise: jest.fn().mockResolvedValueOnce({}),
      });

      jest.spyOn(orderModel, 'create').mockResolvedValue(mockOrder as any);
      jest
        .spyOn(cartModel, 'findOneAndDelete')
        .mockResolvedValue(mockCart as any);

      jest.spyOn(mockCart, 'populate').mockResolvedValue(mockCart as any);
      jest.spyOn(mockOrder, 'populate').mockResolvedValue(mockOrder as any);
      const result = await ordersService.createOrder(userId.toString());

      expect(result).toEqual(mockOrder);
    });
    it('should thorw exception', async () => {
      const userId = 123;
      jest.spyOn(ordersService, 'getCart').mockResolvedValue(null);

      await expect(
        ordersService.createOrder(userId.toString()),
      ).rejects.toThrowError(RpcException);
    });
  });

  describe('cancelOrder', () => {
    it('should change status to Cancelled of order', async () => {
      const userId = 123;

      const mockProduct = {
        _id: 'producy123',
        name: 'Test Product',
        rating: 10,
        stock: 50,
      };

      const orderId = 321;
      const mockOrder = {
        _id: orderId,
        userId: new mongoose.Types.ObjectId(userId),
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

      jest.spyOn(ordersService, 'findOrder').mockResolvedValue(mockOrder);
      jest
        .spyOn(orderModel, 'findOneAndUpdate')
        .mockResolvedValue(updatedOrder);
      (productsClient.send as jest.Mock).mockReturnValue({
        toPromise: jest.fn().mockResolvedValueOnce(mockProduct),
      });
      const result = await ordersService.cancelOrder(
        userId.toString(),
        orderId.toString(),
      );

      expect(result).toEqual(updatedOrder);
    });
    it('should thorw exception as order doesnot exist', async () => {
      const userId = 123;
      const orderId = 321;

      jest.spyOn(ordersService, 'findOrder').mockResolvedValue(null);

      await expect(
        ordersService.cancelOrder(userId.toString(), orderId.toString()),
      ).rejects.toThrowError(RpcException);
    });
    it('should throw exception when order is already cancelled', async () => {
      const userId = 123;
      const orderId = 321;
      const mockOrder = {
        _id: orderId,
        userId: new mongoose.Types.ObjectId(userId),
        items: [
          {
            productId: 'product123',
            quantity: 2,
            subtotal: 20, // Include subtotal
          },
        ],
        totalPrice: 20,
        status: 'Cancelled',
        save: jest.fn(),
        populate: jest.fn(),
      };
      jest.spyOn(ordersService, 'findOrder').mockResolvedValue(mockOrder);

      await expect(
        ordersService.cancelOrder(userId.toString(), orderId.toString()),
      ).rejects.toThrowError(RpcException);
    });
  });
});
