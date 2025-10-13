import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { PrismaModule } from 'src/prisma.module';
import { CloudinaryModule } from 'src/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, AuthModule],

  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}
