import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { ContractGeneratorService } from './contract-generator.service';
import { CloudinaryModule } from '../cloudinary.module';
import { PrismaService } from '../prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [CloudinaryModule, NotificationModule],
  controllers: [ContractController],
  providers: [ContractService, ContractGeneratorService, PrismaService],
  exports: [ContractService, ContractGeneratorService],
})
export class ContractModule {}
