import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateLeaseDto {
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsUUID()
  @IsNotEmpty({ message: "L'ID de la propriété est requis" })
  propertyId: string;

  @IsUUID()
  @IsNotEmpty({ message: "L'ID du locataire est requis" })
  tenantId: string;

  @IsUUID()
  @IsNotEmpty({ message: "L'ID du propriétaire est requis" })
  ownerId: string;

  @IsDateString({}, { message: 'La date de début doit être valide' })
  @IsNotEmpty({ message: 'La date de début est requise' })
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être valide' })
  endDate?: string;

  @IsNumber({}, { message: 'Le montant du loyer doit être un nombre' })
  @IsNotEmpty({ message: 'Le montant du loyer est requis' })
  @Min(0, { message: 'Le montant du loyer doit être positif' })
  rentAmount: number;

  @IsOptional()
  @IsEnum(Currency, { message: 'Devise invalide' })
  currency?: Currency;

  @IsOptional()
  @IsNumber({}, { message: 'Le dépôt de garantie doit être un nombre' })
  @Min(0, { message: 'Le dépôt de garantie doit être positif' })
  deposit?: number;
}
