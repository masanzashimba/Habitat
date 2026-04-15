import {
  IsEmail,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Role } from 'generated/prisma';

export class CreateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() password: string;
  @IsOptional() @IsString() profileImage?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() accountType?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() businessId?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
