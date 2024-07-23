import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { CreateProductDto } from 'shared/dtos/create-product-dto';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import { Product, ProductSchema } from '../src/schemas/product.schema';
import { ProductsController } from '../src/products.controller';
import { ProductsService } from '../src/products.service';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';

jest.setTimeout(20000);

describe('ProductsController (Microservice)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;
  let mongoServer: MongoMemoryServer;
  let productModel: mongoose.Model<Product>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Product.name, schema: ProductSchema },
        ]),
        ClientsModule.register([
          {
            name: 'PRODUCTS_SERVICE',
            transport: Transport.TCP,
          },
        ]),
      ],
      controllers: [ProductsController],
      providers: [ProductsService],
    }).compile();

    app = module.createNestMicroservice({
      transport: Transport.TCP,
    });

    await app.listen();

    client = app.get('PRODUCTS_SERVICE');
    productModel = module.get<mongoose.Model<Product>>('ProductModel');
  });

  afterAll(async () => {
    jest.setTimeout(10000);
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    await app.close();
  });

  it('should create a product', async () => {
    const createProductDto: CreateProductDto = {
      name: 'Test Product',
      author: 'Test Author',
      rating: 5,
      category: 'Test Category',
      stock: 10,
    };

    const response = await client
      .send({ cmd: 'addProduct' }, createProductDto)
      .toPromise();
    expect(response.name).toBe(createProductDto.name);
  });

  it('should get products', async () => {
    const filterProductDto: Partial<FilterProductDto> = {};

    const response = await client
      .send({ cmd: 'getProducts' }, filterProductDto)
      .toPromise();
    expect(response).toBeInstanceOf(Array);
  });

  it('should get a product by id', async () => {
    const product = await productModel.create({
      name: 'Test Product',
      author: 'Test Author',
      rating: 5,
      category: 'Test Category',
      stock: 10,
    });

    const response = await client
      .send({ cmd: 'getProduct' }, product._id.toString())
      .toPromise();
    expect(response._id).toBe(product._id.toString());
  });

  it('should update a product', async () => {
    const product = await productModel.create({
      name: 'Test Product',
      author: 'Test Author',
      rating: 5,
      category: 'Test Category',
      stock: 10,
    });

    const updatedProduct = {
      name: 'Updated Product',
      author: 'Updated Author',
      rating: 4,
      category: 'Updated Category',
      stock: 15,
    };

    const response = await client
      .send(
        { cmd: 'updateProduct' },
        { id: product._id.toString(), product: updatedProduct },
      )
      .toPromise();
    expect(response.name).toBe(updatedProduct.name);
  });

  it('should delete a product', async () => {
    const product = await productModel.create({
      name: 'Test Product',
      author: 'Test Author',
      rating: 5,
      category: 'Test Category',
      stock: 10,
    });

    const response = await client
      .send({ cmd: 'deleteProduct' }, product._id.toString())
      .toPromise();
    expect(response._id).toBe(product._id.toString());

    const deletedProduct = await productModel.findById(product._id);
    expect(deletedProduct).toBeNull();
  });
});
