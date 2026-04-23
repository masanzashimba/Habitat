import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsIn,
} from 'class-validator';

const ENTITY_TYPES = [
  'User',
  'Property',
  'Booking',
  'Lease',
  'Contract',
  'Tenant',
  'Notification',
] as const;

export class CreateAdminActionLogDto {
  @IsUUID()
  @IsNotEmpty({ message: "L'ID de l'admin est requis" })
  adminId: string;

  @IsString()
  @IsNotEmpty({ message: "L'action est requise" })
  action: string;

  @IsString()
  @IsNotEmpty({ message: "Le type d'entité est requis" })
  @IsIn(ENTITY_TYPES, { message: "Type d'entité invalide" })
  entityType: string;

  @IsString()
  @IsNotEmpty({ message: "L'ID de l'entité est requis" })
  entityId: string;

  @IsOptional()
  @IsString()
  description?: string;
}
