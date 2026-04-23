import { Test, TestingModule } from '@nestjs/testing';
import { TemporaryBlockService } from './temporary-block.service';

describe('TemporaryBlockService', () => {
  let service: TemporaryBlockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemporaryBlockService],
    }).compile();

    service = module.get<TemporaryBlockService>(TemporaryBlockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
