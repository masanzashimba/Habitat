import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  @IsNotEmpty({ message: "L'ID du bail est requis" })
  leaseId: string;

  @IsString()
  @IsNotEmpty({ message: "L'URL du fichier est requise" })
  @IsUrl({}, { message: "L'URL du fichier doit être valide" })
  fileUrl: string;

  @IsUUID()
  @IsNotEmpty({ message: "L'ID du créateur est requis" })
  createdBy: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
