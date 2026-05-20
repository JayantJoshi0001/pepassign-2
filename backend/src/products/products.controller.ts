import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Req() request: AuthenticatedRequest) {
    return this.productsService.findProductsByUser(request.user.userId);
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateProductDto,
  ) {
    return this.productsService.createProduct(request.user.userId, body);
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(request.user.userId, id, body);
  }

  @Delete(':id')
  async remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.productsService.deleteProduct(request.user.userId, id);
  }
}
