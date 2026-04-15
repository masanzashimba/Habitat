import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Currency } from 'generated/prisma';

export class AssignTenantDto {
  @IsString()
  tenantEmail: string;

  @IsString()
  propertyId: string;

  @IsNumber()
  rentAmount: number;

  @IsOptional()
  currency?: Currency;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;
}
