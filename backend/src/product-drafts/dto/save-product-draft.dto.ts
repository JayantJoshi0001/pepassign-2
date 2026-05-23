import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

export type ProductDraftScope = 'create' | 'edit';

export class ProductDraftDataDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  stockQuantity?: string;
}

export class SaveProductDraftDto {
  @IsIn(['create', 'edit'])
  scope!: ProductDraftScope;

  @IsOptional()
  @IsString()
  productId?: string;

  @ValidateNested()
  @Type(() => ProductDraftDataDto)
  data!: ProductDraftDataDto;
}