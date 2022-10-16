import { Test, TestingModule } from '@nestjs/testing';
import { AdminConfigService } from './admin-config.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {AdminConfigEntity} from "@app/database/entities/admin-config.entity";

describe('ConfigService', () => {
  let service: AdminConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ TypeOrmModule.forFeature([AdminConfigEntity])],
      providers: [AdminConfigService],
    }).compile();

    service = module.get<AdminConfigService>(AdminConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
