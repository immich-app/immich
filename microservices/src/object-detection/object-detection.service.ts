import { Injectable } from '@nestjs/common';

@Injectable()
export class ObjectDetectionService {
  async detectObject(thumbnailPath: string) {
    return 'ok';
  }
}
