import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { PrismaModule } from '../prisma.module';
import { CloudinaryModule } from '../cloudinary.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, AuthModule],
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [PropertyService], // Export service for other modules
})
export class PropertyModule {}
