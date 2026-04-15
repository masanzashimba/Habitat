import { IsBoolean } from 'class-validator';

export class ToggleTenantStatusDto {
  @IsBoolean()
  isActive: boolean;
}
