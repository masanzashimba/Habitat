import {
  IsEmail,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
  MinLength,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Format de téléphone invalide' })
  phone?: string;

  @IsString({ message: 'Le mot de passe est requis' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
  })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide' })
  role?: Role;

  @IsOptional()
  @IsBoolean({ message: 'isActive doit être un booléen' })
  isActive?: boolean;

  // =====================
  // IDENTITÉ
  // =====================
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'La bio doit être une chaîne de caractères' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Le genre doit être une chaîne de caractères' })
  gender?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Format de date de naissance invalide' })
  birthDate?: string;

  // =====================
  // ADRESSE
  // =====================
  @IsOptional()
  @IsString({ message: 'Le pays doit être une chaîne de caractères' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  city?: string;

  @IsOptional()
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  address?: string;

  // =====================
  // BUSINESS
  // =====================
  @IsOptional()
  @IsString({
    message: "Le nom de l'entreprise doit être une chaîne de caractères",
  })
  companyName?: string;

  @IsOptional()
  @IsString({
    message: "L'ID de l'entreprise doit être une chaîne de caractères",
  })
  companyId?: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Le mot de passe actuel est requis' })
  currentPassword: string;

  @IsString({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
  })
  newPassword: string;
}
