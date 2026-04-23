import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency } from '@prisma/client';

export class AssignTenantDto {
  @IsString()
  tenantEmail: string;

  @IsString()
  propertyId: string;

  @Type(() => Number)
  @IsNumber()
  rentAmount: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deposit?: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
