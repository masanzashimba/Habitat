import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  commune: string;

  @IsString()
  quartier: string;

  @IsString()
  avenue: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
