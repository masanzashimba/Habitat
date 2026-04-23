import { Test, TestingModule } from '@nestjs/testing';
import { AdminActionLogController } from './admin-action-log.controller';
import { AdminActionLogService } from './admin-action-log.service';

describe('AdminActionLogController', () => {
  let controller: AdminActionLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminActionLogController],
      providers: [AdminActionLogService],
    }).compile();

    controller = module.get<AdminActionLogController>(AdminActionLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
