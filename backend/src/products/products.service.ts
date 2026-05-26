import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { Model } from 'mongoose';

import { ProductDraftsService } from '../product-drafts/product-drafts.service';
import { PythonService } from '../python/python.service';
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
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly usersService: UsersService,
    private readonly productDraftsService: ProductDraftsService,
    private readonly pythonService: PythonService,
  ) {}

  async createProduct(
    userId: string,
    payload: CreateProductDto,
  ): Promise<ProductRecord> {
    const ownerBusinessName = await this.getOwnerBusinessName(userId);
    this.logger.debug(
      `Creating product for user ${userId}; image present=${Boolean(payload.imageUrl)}`,
    );
    const imageUrl = await this.enhanceImageIfNeeded(payload.imageUrl);
    this.logger.debug(
      `Image enhancement finished for create flow; enhanced image present=${Boolean(imageUrl)}`,
    );
    const product = await this.productModel.create({
      ...payload,
      imageUrl,
      ownerUserId: userId,
    });

    await this.productDraftsService.clearDraft(userId, 'create');

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

    if (typeof payload.imageUrl !== 'undefined') {
      this.logger.debug(
        `Updating product ${productId} for user ${userId}; image present=${Boolean(payload.imageUrl)}`,
      );
      payload.imageUrl = await this.enhanceImageIfNeeded(payload.imageUrl);
      this.logger.debug(`Image enhancement finished for product ${productId}`);
    }

    Object.assign(product, payload);
    await product.save();

    await this.productDraftsService.clearDraft(userId, 'edit', productId);

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

    await this.productDraftsService.clearDraft(userId, 'edit', productId);

    return { success: true };
  }

  async findProductByUser(
    userId: string,
    productId: string,
  ): Promise<ProductRecord> {
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

  private async enhanceImageIfNeeded(
    imageUrl?: string,
  ): Promise<string | undefined> {
    const trimmedImageUrl = imageUrl?.trim();

    if (!trimmedImageUrl) {
      this.logger.debug('No product image supplied, skipping enhancement');
      return undefined;
    }

    if (!trimmedImageUrl.startsWith('data:image/')) {
      this.logger.debug(
        'Product image is not a data URL; sending source directly to Python service',
      );
      return this.pythonService.enhanceImage(trimmedImageUrl);
    }

    this.logger.debug(
      'Product image is a data URL; writing temp file before Python enhancement',
    );
    return this.enhanceDataUrlImage(trimmedImageUrl);
  }

  private async enhanceDataUrlImage(imageDataUrl: string): Promise<string> {
    const { filePath, tempDir } =
      await this.writeDataUrlToTempFile(imageDataUrl);

    try {
      this.logger.debug(`Temporary upload created at ${filePath}`);
      const enhancedImagePath = await this.pythonService.enhanceImage(filePath);
      this.logger.debug(
        `Python service returned enhanced file ${enhancedImagePath}`,
      );
      const enhancedImageDataUrl =
        await this.readFileAsDataUrl(enhancedImagePath);
      this.logger.debug(
        'Enhanced image converted back to data URL for persistence',
      );

      return enhancedImageDataUrl;
    } finally {
      this.logger.debug(`Cleaning up temporary image directory ${tempDir}`);
      await Promise.allSettled([
        rm(filePath, { force: true }),
        rm(tempDir, { force: true, recursive: true }),
      ]);
    }
  }

  private async writeDataUrlToTempFile(imageDataUrl: string): Promise<{
    filePath: string;
    tempDir: string;
  }> {
    const match = imageDataUrl.match(/^data:(image\/(png|jpeg));base64,(.+)$/i);

    if (!match) {
      throw new Error('Unsupported image data URL.');
    }

    const mimeType = match[1].toLowerCase();
    const extension = mimeType === 'image/jpeg' ? '.jpg' : '.png';
    const tempDir = await mkdtemp(join(tmpdir(), 'product-image-'));
    const filePath = join(tempDir, `upload${extension}`);
    const imageBuffer = Buffer.from(match[3], 'base64');

    await writeFile(filePath, imageBuffer);

    return {
      filePath,
      tempDir,
    };
  }

  private async readFileAsDataUrl(imagePath: string): Promise<string> {
    const extension = extname(imagePath).toLowerCase();
    const mimeType =
      extension === '.jpg' || extension === '.jpeg'
        ? 'image/jpeg'
        : 'image/png';
    const imageBuffer = await readFile(imagePath);
    this.logger.debug(`Read enhanced image file ${imagePath} as ${mimeType}`);
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
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
