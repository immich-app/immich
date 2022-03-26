import { Test, TestingModule } from '@nestjs/testing';
import { ObjectDetectionService } from './object-detection.service';

describe('ObjectDetectionService', () => {
  let service: ObjectDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjectDetectionService],
    }).compile();

    service = module.get<ObjectDetectionService>(ObjectDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
