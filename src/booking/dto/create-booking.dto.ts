import {
  IsDateString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty({ message: "L'ID de la propriété est requis" })
  propertyId: string;
  @IsDateString({}, { message: 'La date de début doit être valide' })
  @IsNotEmpty({ message: 'La date de début est requise' })
  startDate: string;

  @IsDateString({}, { message: 'La date de fin doit être valide' })
  @IsNotEmpty({ message: 'La date de fin est requise' })
  endDate: string;

  @IsOptional()
  @IsInt({ message: 'Le nombre de nuits doit être un entier' })
  @Min(1, { message: 'Le nombre de nuits doit être au moins 1' })
  nights?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Le montant total doit être un nombre' })
  @Min(0, { message: 'Le montant total doit être positif' })
  totalAmount?: number;
}
