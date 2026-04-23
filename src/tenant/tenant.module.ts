import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { PrismaModule } from '../prisma.module';
import { CloudinaryService } from '../cloudinary.service';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantService, CloudinaryService],
  exports: [TenantService],
})
export class TenantModule {}
