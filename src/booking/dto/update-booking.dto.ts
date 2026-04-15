import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @IsEnum(['pending', 'confirmed', 'cancelled'])
  @IsOptional()
  status?: 'pending' | 'confirmed' | 'cancelled';
}
