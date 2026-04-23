import { Test, TestingModule } from '@nestjs/testing';
import { TemporaryBlockController } from './temporary-block.controller';
import { TemporaryBlockService } from './temporary-block.service';

describe('TemporaryBlockController', () => {
  let controller: TemporaryBlockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemporaryBlockController],
      providers: [TemporaryBlockService],
    }).compile();

    controller = module.get<TemporaryBlockController>(TemporaryBlockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
