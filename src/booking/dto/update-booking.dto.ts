import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @IsOptional()
  @IsEnum(BookingStatus, { message: 'Statut de réservation invalide' })
  status?: BookingStatus;
}

export class ValidateBookingDto {
  @IsEnum(BookingStatus, { message: 'Statut invalide' })
  status: BookingStatus;

  @IsOptional()
  @IsUUID()
  validatedById?: string;

  @IsOptional()
  @IsDateString()
  validatedAt?: string;
}
