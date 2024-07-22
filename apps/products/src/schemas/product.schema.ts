import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({
  timestamps: true,
})
export class Product {
  @Prop()
  name: string;

  @Prop()
  author: string;

  @Prop()
  rating: number;

  @Prop()
  category: string;

  @Prop({ default: 100 })
  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
