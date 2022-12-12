import { Injectable } from '@nestjs/common';
import { IImmichStorage } from './interfaces/immich-storage.interface';

@Injectable()
export class FileSystemStorageService implements IImmichStorage {
  read(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async write() {
    console.log('FileSystemStorageService.save');
  }
}
