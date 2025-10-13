import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PropertyType,
  Currency,
  PropertyStatus,
  PropertyPurpose,
} from 'generated/prisma';
import { CreateAddressDto } from './CreateAddressDto';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsNumber()
  price: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsEnum(PropertyPurpose)
  @IsOptional()
  purpose?: PropertyPurpose;

  // @IsString()
  // @IsNotEmpty()
  // userId: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;
}
