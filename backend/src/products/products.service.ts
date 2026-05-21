import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UsersService } from '../users/users.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';

export interface ProductRecord {
  id: string;
  productName: string;
  productDescription: string;
  price: number;
  category: string;
  imageUrl?: string;
  stockQuantity: number;
  ownerUserId: string;
  ownerBusinessName: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly usersService: UsersService,
  ) {}

  async createProduct(
    userId: string,
    payload: CreateProductDto,
  ): Promise<ProductRecord> {
    const ownerBusinessName = await this.getOwnerBusinessName(userId);
    const product = await this.productModel.create({
      ...payload,
      ownerUserId: userId,
    });

    return this.toProductRecord(product, ownerBusinessName);
  }

  async findProductsByUser(userId: string): Promise<ProductRecord[]> {
    const ownerBusinessName = await this.getOwnerBusinessName(userId);
    const products = await this.productModel
      .find({ ownerUserId: userId })
      .sort({ createdAt: -1 })
      .exec();

    return products.map((product) =>
      this.toProductRecord(product, ownerBusinessName),
    );
  }

  async updateProduct(
    userId: string,
    productId: string,
    payload: UpdateProductDto,
  ): Promise<ProductRecord> {
    const product = await this.productModel
      .findOne({ _id: productId, ownerUserId: userId })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    Object.assign(product, payload);
    await product.save();

    const ownerBusinessName = await this.getOwnerBusinessName(userId);
    return this.toProductRecord(product, ownerBusinessName);
  }

  async deleteProduct(
    userId: string,
    productId: string,
  ): Promise<{ success: true }> {
    const result = await this.productModel
      .deleteOne({ _id: productId, ownerUserId: userId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Product not found.');
    }

    return { success: true };
  }

  async findProductByUser(userId: string, productId: string): Promise<ProductRecord> {
    console.log(`Finding product with ID ${productId} for user ${userId}`);
    const product = await this.productModel
      .findOne({ _id: productId, ownerUserId: userId })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const ownerBusinessName = await this.getOwnerBusinessName(userId);
    return this.toProductRecord(product, ownerBusinessName);
  }

  private async getOwnerBusinessName(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);

    if (!user?.onboardingComplete || !user.businessProfile?.businessName) {
      throw new ForbiddenException(
        'Complete your business profile before managing products.',
      );
    }

    return user.businessProfile.businessName;
  }

  private toProductRecord(
    product: Product,
    ownerBusinessName: string,
  ): ProductRecord {
    return {
      id: product._id.toString(),
      productName: product.productName,
      productDescription: product.productDescription,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
      ownerUserId: product.ownerUserId.toString(),
      ownerBusinessName,
      createdAt: (product as unknown as { createdAt: Date }).createdAt,
      updatedAt: (product as unknown as { updatedAt: Date }).updatedAt,
    };
  }
}
