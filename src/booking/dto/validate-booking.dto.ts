import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class ValidateBookingDto {
  @IsEnum(BookingStatus, { message: 'Statut de réservation invalide' })
  @IsNotEmpty({ message: 'Le statut est requis' })
  status: BookingStatus;
}
