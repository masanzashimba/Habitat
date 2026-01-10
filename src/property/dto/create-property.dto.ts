import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PropertyType,
  Currency,
  PropertyStatus,
  PropertyPurpose,
  PriceUnit,
} from 'generated/prisma';
import { CreateAddressDto } from './CreateAddressDto';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PropertyType)
  @IsNotEmpty()
  propertyType: PropertyType;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsEnum(PriceUnit)
  @IsOptional()
  priceUnit?: PriceUnit;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsEnum(PropertyPurpose)
  @IsOptional()
  purpose?: PropertyPurpose;

  @IsInt()
  @IsOptional()
  @Min(0)
  maxGuests?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  beds?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  kitchens?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  livingRooms?: number;

  @IsString()
  @IsOptional()
  otherRooms?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  discount?: number;

  @IsString()
  @IsOptional()
  paymentType?: string;

  @IsString()
  @IsOptional()
  specialNotes?: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  amenities?: string[];
}
