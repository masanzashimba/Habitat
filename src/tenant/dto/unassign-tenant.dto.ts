import { IsNotEmpty, IsString } from 'class-validator';

export class UnassignTenantDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsString()
  propertyId: string;
}
