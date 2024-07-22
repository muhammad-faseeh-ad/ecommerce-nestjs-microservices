import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type ItemDocument = Item & Document;
@Schema()
export class Item {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product' })
  productId: string;

  @Prop()
  quantity: number;

  @Prop()
  subtotal: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
