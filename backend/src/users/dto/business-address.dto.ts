import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';

const normalizeText = ({ value }: { value: unknown }) =>
  value === undefined || value === null
    ? undefined
    : (() => {
        const trimmed = String(value).trim();
        return trimmed.length > 0 ? trimmed : undefined;
      })();

export class BusinessAddressDto {
  @IsString()
  @MinLength(3)
  @Transform(normalizeText)
  street!: string;

  @IsOptional()
  @IsString()
  @Transform(normalizeText)
  landmark?: string;

  @IsString()
  @MinLength(2)
  @Transform(normalizeText)
  city!: string;

  @IsString()
  @MinLength(2)
  @Transform(normalizeText)
  district!: string;

  @IsString()
  @MinLength(2)
  @Transform(normalizeText)
  state!: string;

  @IsString()
  @MinLength(2)
  @Transform(normalizeText)
  country!: string;

  @IsString()
  @Length(4, 12)
  @Transform(normalizeText)
  pincode!: string;

  @IsOptional()
  @IsString()
  @Transform(normalizeText)
  latitude?: string;

  @IsOptional()
  @IsString()
  @Transform(normalizeText)
  longitude?: string;
}
