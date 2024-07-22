import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from 'shared/dtos/create-product-dto';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';

describe('ProductsController', () => {
  let productsService: ProductsService;
  let productsController: ProductsController;

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
  };

  const mockProductService = {
    getHello: jest.fn().mockReturnValue('Hello World!'),
    getProduct: jest.fn(),
    getProducts: jest.fn(),
    addProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    productsController = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(productsController.getHello()).toBe('Hello World!');
    });
  });

  describe('getProduct', () => {
    it('should return the product', async () => {
      jest.spyOn(productsService, 'getProduct').mockResolvedValue(mockProduct);
      const result = await productsController.getProductById(mockProduct._id);
      expect(result).toEqual(mockProduct);
      expect(productsService.getProduct).toHaveBeenCalledWith(mockProduct._id);
    });
  });

  describe('getProducts', () => {
    it('should return an array of products', async () => {
      const filters: FilterProductDto = { search: 'M1', category: 'mystery' };
      jest
        .spyOn(productsService, 'getProducts')
        .mockResolvedValue([mockProduct as any]);
      const result = await productsController.getProds(filters);
      expect(result).toEqual([mockProduct]);
      expect(productsService.getProducts).toHaveBeenCalled();
    });

    it('should return all products if no filters are provided', async () => {
      const result = await productsController.getProds({
        search: '',
        category: '',
      });
      expect(result).toEqual([mockProduct]);
      expect(productsService.getProducts).toHaveBeenCalled();
    });
  });

  describe('addProduct', () => {
    it('should add and return the new product', async () => {
      const newProductDto: CreateProductDto = {
        name: 'M2',
        author: 'S2',
        rating: 12.99,
        category: 'thriller',
        stock: 50,
      };
      jest
        .spyOn(productsService, 'addProduct')
        .mockResolvedValueOnce(newProductDto);
      const result = await productsController.addProduct(newProductDto);
      expect(result).toEqual(newProductDto);
      expect(productsService.addProduct).toHaveBeenCalledWith(newProductDto);
    });
  });

  describe('updateProduct', () => {
    it('should update and return the product', async () => {
      const updatedProductDto: Partial<CreateProductDto> = {
        name: 'Updated M1',
      };
      const updatedProduct = { ...mockProduct, name: 'Updated M1' };
      jest.spyOn(productsService, 'updateProduct').mockImplementation(() => {
        return updatedProduct as any;
      });
      const data = { id: mockProduct._id, product: updatedProductDto };
      const result = await productsController.updateProduct(data);
      expect(result.name).toEqual(updatedProductDto.name);
      expect(productsService.updateProduct).toHaveBeenCalledWith(
        mockProduct._id,
        updatedProductDto,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete and return the product', async () => {
      const mockProductId = '668bd1aca18f8f09532f0b10';
      const mockProduct = {
        _id: mockProductId,
        name: 'M1',
        author: 'S1',
        rating: 11.99,
        category: 'mystery',
        stock: 100,
        createdAt: new Date('2024-07-08T11:46:52.656Z'),
        updatedAt: new Date('2024-07-08T11:46:52.656Z'),
        __v: 0,
      };

      jest
        .spyOn(productsService, 'deleteProduct')
        .mockResolvedValue(mockProduct);

      const result = await productsController.deleteProduct(mockProductId);

      expect(result).toEqual(mockProduct);
      expect(productsService.deleteProduct).toHaveBeenCalledWith(mockProductId);
    });
  });
});
