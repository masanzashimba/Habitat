import { IsEnum, IsNotEmpty } from 'class-validator';
import { LeaseStatus } from '@prisma/client';

export class UpdateLeaseStatusDto {
  @IsEnum(LeaseStatus, { message: 'Statut de bail invalide' })
  @IsNotEmpty({ message: 'Le statut est requis' })
  status: LeaseStatus;
}
