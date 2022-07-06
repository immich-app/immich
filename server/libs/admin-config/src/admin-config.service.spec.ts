import { Test, TestingModule } from '@nestjs/testing';
import { AdminConfigService } from './admin-config.service';

describe('ConfigService', () => {
  let service: AdminConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminConfigService],
    }).compile();

    service = module.get<AdminConfigService>(AdminConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
