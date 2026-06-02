import { Controller, Get, Query } from '@nestjs/common';

import { ProductsService } from './products.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  async findAll(@Query('category') category?: string) {
    return this.productsService.findMarketplaceProducts(category);
  }
}
