import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaseDto } from './create-lease.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { LeaseStatus } from '@prisma/client';

export class UpdateLeaseDto extends PartialType(CreateLeaseDto) {
  @IsOptional()
  @IsEnum(LeaseStatus, { message: 'Statut de bail invalide' })
  status?: LeaseStatus;
}
