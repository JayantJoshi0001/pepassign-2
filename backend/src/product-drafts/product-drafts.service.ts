import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SaveProductDraftDto } from './dto/save-product-draft.dto';
import { ProductDraftData } from './schemas/product-draft.schema';
import { ProductDraft } from './schemas/product-draft.schema';

interface ProductDraftEntity {
  _id: { toString(): string };
  ownerUserId: { toString(): string };
  scope: 'create' | 'edit';
  productId?: string | null;
  data: ProductDraftData;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface ProductDraftRecord {
  id: string;
  ownerUserId: string;
  scope: 'create' | 'edit';
  productId?: string;
  data: {
    productName?: string;
    productDescription?: string;
    price?: string;
    category?: string;
    imageUrl?: string;
    stockQuantity?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const PRODUCT_DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class ProductDraftsService {
  constructor(
    @InjectModel(ProductDraft.name)
    private readonly productDraftModel: Model<ProductDraft>,
  ) {}

  async findDraft(
    userId: string,
    scope: 'create' | 'edit',
    productId?: string,
  ): Promise<ProductDraftRecord | null> {
    const normalizedProductId = scope === 'create' ? null : productId?.trim();

    const draft = await this.productDraftModel
      .findOne({ ownerUserId: userId, scope, productId: normalizedProductId })
      .exec();

    if (!draft) {
      return null;
    }

    return this.toRecord(draft as unknown as ProductDraftEntity);
  }

  async saveDraft(
    userId: string,
    payload: SaveProductDraftDto,
  ): Promise<ProductDraftRecord> {
    const expiresAt = new Date(Date.now() + PRODUCT_DRAFT_TTL_MS);
    const normalizedProductId =
      payload.scope === 'create' ? null : payload.productId?.trim();

    const draft = await this.productDraftModel
      .findOneAndUpdate(
        {
          ownerUserId: userId,
          scope: payload.scope,
          productId: normalizedProductId,
        },
        {
          ownerUserId: userId,
          scope: payload.scope,
          productId: normalizedProductId,
          data: {
            productName: payload.data.productName?.trim(),
            productDescription: payload.data.productDescription?.trim(),
            price: payload.data.price?.trim(),
            category: payload.data.category?.trim(),
            imageUrl: payload.data.imageUrl?.trim(),
            stockQuantity: payload.data.stockQuantity?.trim(),
          },
          expiresAt,
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    return this.toRecord(draft as unknown as ProductDraftEntity);
  }

  async clearDraft(
    userId: string,
    scope: 'create' | 'edit',
    productId?: string,
  ): Promise<{ success: true }> {
    const normalizedProductId = scope === 'create' ? null : productId?.trim();

    await this.productDraftModel
      .deleteOne({ ownerUserId: userId, scope, productId: normalizedProductId })
      .exec();

    return { success: true };
  }

  private toRecord(draft: ProductDraftEntity): ProductDraftRecord {
    return {
      id: draft._id.toString(),
      ownerUserId: draft.ownerUserId.toString(),
      scope: draft.scope,
      productId: draft.productId ?? undefined,
      data: {
        productName: draft.data?.productName,
        productDescription: draft.data?.productDescription,
        price: draft.data?.price,
        category: draft.data?.category,
        imageUrl: draft.data?.imageUrl,
        stockQuantity: draft.data?.stockQuantity,
      },
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      expiresAt: draft.expiresAt,
    };
  }
}
