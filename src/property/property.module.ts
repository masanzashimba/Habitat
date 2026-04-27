import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { PrismaModule } from '../prisma.module';
import { CloudinaryModule } from '../cloudinary.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { PropertyGateway } from './property.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    NotificationModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [PropertyController],
  providers: [PropertyService, PropertyGateway],
  exports: [PropertyService, PropertyGateway],
})
export class PropertyModule {}
