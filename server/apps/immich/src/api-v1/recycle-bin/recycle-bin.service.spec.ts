import { Test, TestingModule } from '@nestjs/testing';
import { RecycleBinService } from './recycle-bin.service';

describe('RecycleBinService', () => {
  let service: RecycleBinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecycleBinService],
    }).compile();

    service = module.get<RecycleBinService>(RecycleBinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
