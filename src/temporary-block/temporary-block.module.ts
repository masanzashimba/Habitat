import { Module } from '@nestjs/common';
import { TemporaryBlockService } from './temporary-block.service';
import { TemporaryBlockController } from './temporary-block.controller';

@Module({
  controllers: [TemporaryBlockController],
  providers: [TemporaryBlockService],
  exports: [TemporaryBlockService],
})
export class TemporaryBlockModule {}
