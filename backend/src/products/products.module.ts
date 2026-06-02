import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductDraftsModule } from '../product-drafts/product-drafts.module';
import { PythonModule } from '../python/python.module';
import { UsersModule } from '../users/users.module';
import { MarketplaceController } from './marketplace.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    ProductDraftsModule,
    PythonModule,
    UsersModule,
  ],
  controllers: [ProductsController, MarketplaceController],
  providers: [ProductsService],
})
export class ProductsModule {}
