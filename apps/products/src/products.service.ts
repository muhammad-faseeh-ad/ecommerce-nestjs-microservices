import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';
import { CreateProductDto } from 'shared/dtos/create-product-dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private ProductModel: mongoose.Model<ProductDocument>,
  ) {}

  async getProducts(
    filterProductDto: Partial<FilterProductDto>,
  ): Promise<Product[]> {
    if (Object.keys(filterProductDto).length) {
      const { search, category } = filterProductDto;

      let products = await this.ProductModel.find().exec();

      if (search) {
        products = products.filter(
          (product) =>
            product.name.includes(search) || product.author.includes(search),
        );
      }

      if (category) {
        products = products.filter((product) => product.category === category);
      }

      return products;
    } else {
      const products = await this.ProductModel.find().exec();
      return products;
    }
  }

  async getProduct(id: string): Promise<Product> {
    const prod = await this.ProductModel.findById(id).exec();
    return prod;
  }

  async addProduct(product: CreateProductDto): Promise<Product> {
    const newprod = await this.ProductModel.create(product);
    return newprod.save();
  }

  async updateProduct(
    id: string,
    product: Partial<CreateProductDto>,
  ): Promise<Product> {
    const updatedProduct = await this.ProductModel.findByIdAndUpdate(
      id,
      { $set: product },
      { new: true, runValidators: true },
    ).exec();

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<Product> {
    const deleted = await this.ProductModel.findByIdAndDelete(id);

    return deleted;
  }
}
