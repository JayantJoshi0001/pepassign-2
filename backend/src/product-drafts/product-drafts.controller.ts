import { Body, Controller, Delete, Get, Put, Query, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductDraftQueryDto } from './dto/product-draft-query.dto';
import { SaveProductDraftDto } from './dto/save-product-draft.dto';
import { ProductDraftsService } from './product-drafts.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('product-drafts')
export class ProductDraftsController {
  constructor(private readonly productDraftsService: ProductDraftsService) {}

  @Get('me')
  async getDraft(@Req() request: AuthenticatedRequest, @Query() query: ProductDraftQueryDto) {
    return this.productDraftsService.findDraft(
      request.user.userId,
      query.scope ?? 'create',
      query.productId,
    );
  }

  @Put('me')
  async saveDraft(
    @Req() request: AuthenticatedRequest,
    @Body() body: SaveProductDraftDto,
  ) {
    return this.productDraftsService.saveDraft(request.user.userId, body);
  }

  @Delete('me')
  async clearDraft(@Req() request: AuthenticatedRequest, @Query() query: ProductDraftQueryDto) {
    return this.productDraftsService.clearDraft(
      request.user.userId,
      query.scope ?? 'create',
      query.productId,
    );
  }
}