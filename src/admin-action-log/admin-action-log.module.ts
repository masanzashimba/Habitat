import { Module } from '@nestjs/common';
import { AdminActionLogService } from './admin-action-log.service';
import { AdminActionLogController } from './admin-action-log.controller';

@Module({
  controllers: [AdminActionLogController],
  providers: [AdminActionLogService],
  exports: [AdminActionLogService],
})
export class AdminActionLogModule {}
