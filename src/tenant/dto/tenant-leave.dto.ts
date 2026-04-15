import { IsString } from 'class-validator';

export class TenantLeaveDto {
  @IsString()
  propertyId: string;
}
