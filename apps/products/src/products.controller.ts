import { Controller, Get } from '@nestjs/common';
import { Product } from './schemas/product.schema';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';
import { CreateProductDto } from 'shared/dtos/create-product-dto';
import { ProductsService } from './products.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller('store/products')
export class ProductsController {
  constructor(private productService: ProductsService) {}

  @Get()
  getHello(): string {
    return this.productService.getHello();
  }

  @MessagePattern({ cmd: 'getProducts' })
  async getProds(filters: FilterProductDto): Promise<Product[]> {
    const products = await this.productService.getProducts(filters);
    return products;
  }

  @MessagePattern({ cmd: 'addProduct' })
  async addProduct(product: CreateProductDto): Promise<Product> {
    const newprod = await this.productService.addProduct(product);

    return newprod;
  }

  @MessagePattern({ cmd: 'getProduct' })
  async getProductById(id: string): Promise<Product> {
    const prod = await this.productService.getProduct(id);

    return prod;
  }

  @MessagePattern({ cmd: 'updateProduct' })
  async updateProduct(data: any): Promise<Product> {
    const { id, product } = data;
    const newprod = await this.productService.updateProduct(id, product);
    return newprod;
  }

  @MessagePattern({ cmd: 'deleteProduct' })
  async deleteProduct(id: string): Promise<Product> {
    const prod = await this.productService.deleteProduct(id);
    return prod;
  }
}
