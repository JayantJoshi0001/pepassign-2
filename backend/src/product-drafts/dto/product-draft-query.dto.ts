import { IsIn, IsOptional, IsString } from 'class-validator';

export type ProductDraftScope = 'create' | 'edit';

export class ProductDraftQueryDto {
  @IsOptional()
  @IsIn(['create', 'edit'])
  scope?: ProductDraftScope;

  @IsOptional()
  @IsString()
  productId?: string;
}