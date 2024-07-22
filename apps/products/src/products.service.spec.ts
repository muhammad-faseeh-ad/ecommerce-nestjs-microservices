import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Model } from 'mongoose';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';
import { CreateProductDto } from 'shared/dtos/create-product-dto';

describe('ProductsService', () => {
  let productsService: ProductsService;
  let model: Model<ProductDocument>;

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

  const mockProductModel = {
    findById: jest.fn(),
    // findById: jest.fn().mockImplementation((id: string) => ({
    //   exec: jest.fn().mockResolvedValue(mockProduct),
    // })),
    create: jest.fn().mockImplementation((product: CreateProductDto) => ({
      save: jest.fn().mockResolvedValue(product),
    })),
    find: jest.fn(),
    // find: jest.fn().mockImplementation(() => ({
    //   exec: jest.fn().mockResolvedValue([mockProduct]),
    // })),
    // findByIdAndUpdate: jest
    //   .fn()
    //   .mockImplementation((id: string, update: any) => ({
    //     exec: jest.fn().mockResolvedValue(mockProduct),
    //   })),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue(mockProduct),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);
    model = module.get<Model<ProductDocument>>(getModelToken(Product.name));
  });

  it('should be defined', () => {
    expect(productsService).toBeDefined();
  });

  describe('getProduct', () => {
    it('should return the product', async () => {
      jest.spyOn(model, 'findById').mockImplementation(
        () =>
          ({
            exec: jest.fn().mockResolvedValue(mockProduct),
          }) as any,
      );
      const result = await productsService.getProduct(mockProduct._id);
      expect(result).toEqual(mockProduct);
      expect(model.findById).toHaveBeenCalledWith(mockProduct._id);
    });
  });

  describe('getProducts', () => {
    it('should return an array of products', async () => {
      const filters: FilterProductDto = { search: 'M1', category: 'mystery' };
      jest.spyOn(model, 'find').mockImplementation(
        () =>
          ({
            exec: jest.fn().mockResolvedValue([mockProduct]),
          }) as any,
      );
      const result = await productsService.getProducts(filters);
      expect(result).toEqual([mockProduct]);
      expect(model.find).toHaveBeenCalled();
    });

    it('should return all products if no filters are provided', async () => {
      const result = await productsService.getProducts({
        search: '',
        category: '',
      });
      expect(result).toEqual([mockProduct]);
      expect(model.find).toHaveBeenCalled();
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
      const result = await productsService.addProduct(newProductDto);
      expect(result).toEqual(newProductDto);
      expect(model.create).toHaveBeenCalledWith(newProductDto);
    });
  });

  describe('updateProduct', () => {
    it('should update and return the product', async () => {
      const updatedProductDto: Partial<CreateProductDto> = {
        name: 'Updated M1',
      };
      const updatedProduct = { ...mockProduct, name: 'Updated M1' };
      jest.spyOn(model, 'findByIdAndUpdate').mockImplementation(
        () =>
          ({
            exec: jest.fn().mockResolvedValue(updatedProduct),
          }) as any,
      );
      const result = await productsService.updateProduct(
        mockProduct._id,
        updatedProductDto,
      );
      expect(result.name).toEqual(updatedProductDto.name);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProduct._id,
        { $set: updatedProductDto },
        { new: true, runValidators: true },
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

      jest.spyOn(model, 'findByIdAndDelete').mockResolvedValue(mockProduct);

      const result = await productsService.deleteProduct(mockProductId);

      expect(result).toEqual(mockProduct);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(mockProductId);
    });
  });
});
