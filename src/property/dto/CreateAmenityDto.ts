import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAmenityDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
