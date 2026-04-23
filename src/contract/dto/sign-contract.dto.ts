import { IsOptional, IsUUID } from 'class-validator';

export class SignContractDto {
  @IsOptional()
  @IsUUID()
  userId?: string;
}
