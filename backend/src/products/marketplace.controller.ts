import { Controller, Get, Query } from '@nestjs/common';

import { ProductsService } from './products.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  async findAll(
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('brand') brand?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('minQuantity') minQuantity?: string,
    @Query('maxQuantity') maxQuantity?: string,
  ) {
    return this.productsService.findMarketplaceProducts({
      category,
      minPrice,
      maxPrice,
      brand,
      city,
      country,
      minQuantity,
      maxQuantity,
    });
  }

  @Get('search')
  async search(@Query('query') query?: string) {
    return this.productsService.search(query);
  }
}
