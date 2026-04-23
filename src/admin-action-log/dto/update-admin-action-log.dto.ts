import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminActionLogDto } from './create-admin-action-log.dto';

export class UpdateAdminActionLogDto extends PartialType(
  CreateAdminActionLogDto,
) {}
