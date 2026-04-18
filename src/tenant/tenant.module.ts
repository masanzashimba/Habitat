import { Module } from '@nestjs/common';
import { TenantController } from './tenant/tenant.controller';
import { TenantService } from './tenant/tenant.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, PrismaService, CloudinaryService],
  exports: [TenantService],
})
export class TenantModule {}
