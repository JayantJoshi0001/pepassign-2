import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  productName!: string;

  @Prop({ required: true, trim: true })
  productDescription!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ required: true, min: 0 })
  stockQuantity!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerUserId!: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
