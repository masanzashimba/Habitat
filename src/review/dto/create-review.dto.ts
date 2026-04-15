import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt({ message: 'La note doit être un nombre entier' })
  @Min(1, { message: 'La note minimale est 1' })
  @Max(5, { message: 'La note maximale est 5' })
  rating: number;

  @IsOptional()
  @IsString({ message: 'Le commentaire doit être une chaîne de caractères' })
  @MinLength(10, { message: 'Le commentaire doit contenir au moins 10 caractères' })
  @MaxLength(500, { message: 'Le commentaire ne peut pas dépasser 500 caractères' })
  comment?: string;
}
