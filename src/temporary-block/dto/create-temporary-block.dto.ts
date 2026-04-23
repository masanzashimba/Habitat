import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateTemporaryBlockDto {
  @IsUUID()
  @IsNotEmpty({ message: "L'ID de la propriété est requis" })
  propertyId: string;

  @IsDateString({}, { message: 'La date de début doit être valide' })
  @IsNotEmpty({ message: 'La date de début est requise' })
  startDate: string;

  @IsDateString({}, { message: 'La date de fin doit être valide' })
  @IsNotEmpty({ message: 'La date de fin est requise' })
  endDate: string;

  @IsString()
  @IsNotEmpty({ message: "L'ID de session est requis" })
  sessionId: string;

  @IsOptional()
  @IsInt({ message: 'La durée doit être un entier' })
  @Min(1, { message: 'La durée doit être au moins 1 minute' })
  @Max(30, { message: 'La durée ne peut pas dépasser 30 minutes' })
  durationMinutes?: number = 15; // Défaut: 15 minutes
}
