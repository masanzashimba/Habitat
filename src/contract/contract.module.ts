import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { ContractGeneratorService } from './contract-generator.service';
import { CloudinaryModule } from '../cloudinary.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [ContractController],
  providers: [ContractService, ContractGeneratorService, PrismaService],
  exports: [ContractService, ContractGeneratorService],
})
export class ContractModule {}
