import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty({ message: "L'ID de l'utilisateur est requis" })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Le titre est requis' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Le message est requis' })
  message: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  data?: any;
}
