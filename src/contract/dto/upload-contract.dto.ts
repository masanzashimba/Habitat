import { IsUUID, IsNotEmpty } from 'class-validator';

export class UploadContractDto {
  @IsUUID()
  @IsNotEmpty({ message: "L'ID du bail est requis" })
  leaseId: string;
}
