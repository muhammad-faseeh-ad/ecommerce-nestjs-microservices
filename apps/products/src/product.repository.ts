import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from 'shared/dtos/create-product-dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private productModel: mongoose.Model<ProductDocument>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findById(id: string): Promise<Product> {
    return this.productModel.findById(id).exec();
  }

  async create(product: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel(product);
    return newProduct.save();
  }

  async findByIdAndUpdate(
    id: string,
    product: Partial<CreateProductDto>,
  ): Promise<Product> {
    return this.productModel
      .findByIdAndUpdate(
        id,
        { $set: product },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async findByIdAndDelete(id: string): Promise<Product> {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
