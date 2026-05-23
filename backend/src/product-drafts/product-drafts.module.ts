import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductDraftsController } from './product-drafts.controller';
import { ProductDraftsService } from './product-drafts.service';
import { ProductDraft, ProductDraftSchema } from './schemas/product-draft.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductDraft.name, schema: ProductDraftSchema },
    ]),
  ],
  controllers: [ProductDraftsController],
  providers: [ProductDraftsService],
  exports: [ProductDraftsService],
})
export class ProductDraftsModule {}