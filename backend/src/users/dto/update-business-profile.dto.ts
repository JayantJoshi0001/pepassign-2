import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

import { BusinessAddressDto } from './business-address.dto';

const normalizeText = ({ value }: { value: unknown }) =>
  value === undefined || value === null
    ? undefined
    : (() => {
        const trimmed = String(value).trim();
        return trimmed.length > 0 ? trimmed : undefined;
      })();

export class UpdateBusinessProfileDto {
  @IsString()
  @MinLength(2)
  @Transform(normalizeText)
  businessName!: string;

  @ValidateNested()
  @Type(() => BusinessAddressDto)
  businessAddress!: BusinessAddressDto;

  @IsString()
  @MinLength(20)
  @Transform(normalizeText)
  businessDescription!: string;

  @IsString()
  @MinLength(7)
  @Transform(normalizeText)
  contactNumber!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) =>
        item === undefined || item === null ? '' : String(item).trim(),
      )
      .filter(Boolean);
  })
  businessCategory!: string[];

  @IsOptional()
  @IsString()
  @Transform(normalizeText)
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  @Transform(normalizeText)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(2800000)
  @Matches(/^data:image\/(png|jpeg|jpg);base64,/i, {
    message: 'Logo must be a JPG or PNG data URL.',
  })
  @Transform(normalizeText)
  @IsBase64ImageMaxSize(2 * 1024 * 1024, {
    message: 'Logo must be 2 MB or smaller when decoded.',
  })
  logo?: string;
}

function IsBase64ImageMaxSize(
  maxBytes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isBase64ImageMaxSize',
      target: (object as any).constructor,
      propertyName,
      constraints: [maxBytes],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value === undefined || value === null || value === '')
            return true;
          if (typeof value !== 'string') return false;

          const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(value);
          if (!match) return false;

          const base64Part = match[2];

          try {
            const buffer = Buffer.from(base64Part, 'base64');
            return buffer.length <= (args.constraints?.[0] ?? maxBytes);
          } catch (e) {
            return false;
          }
        },
      },
    });
  };
}
