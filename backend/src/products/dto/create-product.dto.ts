import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  productName!: string;

  @IsString()
  @MinLength(10)
  productDescription!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @MinLength(2)
  category!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim() : undefined))
  imageUrl?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity!: number;
}
