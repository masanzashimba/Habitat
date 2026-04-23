import { Test, TestingModule } from '@nestjs/testing';
import { AdminActionLogService } from './admin-action-log.service';

describe('AdminActionLogService', () => {
  let service: AdminActionLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminActionLogService],
    }).compile();

    service = module.get<AdminActionLogService>(AdminActionLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
