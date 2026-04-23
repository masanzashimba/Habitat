import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: "L'ancien mot de passe est requis" })
  currentPassword: string;

  @IsString({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
  })
  newPassword: string;

  @IsString({ message: 'La confirmation du mot de passe est requise' })
  confirmPassword: string;
}
