import { PartialType } from '@nestjs/mapped-types';
import { CreateContractDto } from './create-contract.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @IsOptional()
  @IsDateString({}, { message: 'La date de signature doit être valide' })
  signedAt?: string;
}
