import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { Product } from './schemas/product.schema';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';
import { CreateProductDto } from 'shared/dtos/create-product-dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getProducts(
    filterProductDto: Partial<FilterProductDto>,
  ): Promise<Product[]> {
    let products = await this.productRepository.findAll();

    if (Object.keys(filterProductDto).length) {
      const { search, category } = filterProductDto;

      if (search) {
        products = products.filter(
          (product) =>
            product.name.includes(search) || product.author.includes(search),
        );
      }

      if (category) {
        products = products.filter((product) => product.category === category);
      }
    }

    return products;
  }

  async getProduct(id: string): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async addProduct(product: CreateProductDto): Promise<Product> {
    return this.productRepository.create(product);
  }

  async updateProduct(
    id: string,
    product: Partial<CreateProductDto>,
  ): Promise<Product> {
    return this.productRepository.findByIdAndUpdate(id, product);
  }

  async deleteProduct(id: string): Promise<Product> {
    return this.productRepository.findByIdAndDelete(id);
  }
}
