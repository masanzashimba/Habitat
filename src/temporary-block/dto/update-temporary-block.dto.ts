import { PartialType } from '@nestjs/mapped-types';
import { CreateTemporaryBlockDto } from './create-temporary-block.dto';

export class UpdateTemporaryBlockDto extends PartialType(
  CreateTemporaryBlockDto,
) {}
