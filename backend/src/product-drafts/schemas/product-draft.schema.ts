import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDraftScope = 'create' | 'edit';

@Schema({ _id: false })
export class ProductDraftData {
  @Prop()
  productName?: string;

  @Prop()
  productDescription?: string;

  @Prop()
  price?: string;

  @Prop()
  category?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  stockQuantity?: string;
}

export const ProductDraftDataSchema = SchemaFactory.createForClass(ProductDraftData);

@Schema({ timestamps: true })
export class ProductDraft extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  ownerUserId!: Types.ObjectId;

  @Prop({ required: true, enum: ['create', 'edit'] })
  scope!: ProductDraftScope;

  @Prop({ type: String, trim: true, default: null })
  productId?: string | null;

  @Prop({ type: ProductDraftDataSchema, required: true })
  data!: ProductDraftData;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt!: Date;
}

export const ProductDraftSchema = SchemaFactory.createForClass(ProductDraft);

ProductDraftSchema.index(
  { ownerUserId: 1, scope: 1, productId: 1 },
  { unique: true },
);