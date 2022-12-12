import { Injectable } from '@nestjs/common';
import { ImmichStorageInterface } from './interfaces/immich-storage.interface';
@Injectable()
export class S3StorageService implements ImmichStorageInterface {
  async read(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async write() {
    console.log('FileSystemStorageService.save');
  }
}
