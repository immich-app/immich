import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigEntity } from '@app/database/entities/system-config.entity';

describe('ConfigService', () => {
  let service: SystemConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forFeature([SystemConfigEntity])],
      providers: [SystemConfigService],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
