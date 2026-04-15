import { IsDateString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @IsOptional()
  totalAmount?: number;
}
