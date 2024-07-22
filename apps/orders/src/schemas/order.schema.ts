import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Item } from './item.schema';

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop()
  items: Item[];

  @Prop()
  totalPrice: number;

  @Prop({ default: 'Confirmed' })
  status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
