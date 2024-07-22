import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Item } from './item.schema';

export type CartDocument = Cart & Document;

@Schema({
  timestamps: true,
})
export class Cart {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' }) // Ensure userId is an ObjectId
  userId: Types.ObjectId;

  @Prop()
  items: Item[];

  @Prop()
  totalPrice: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
