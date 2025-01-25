import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from 'node:child_process';
import { IProcessRepository } from 'src/interfaces/process.interface';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';

@Injectable()
export class ProcessRepository implements IProcessRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(StorageRepository.name);
  }

  spawn(command: string, args: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams {
    return spawn(command, args, options);
  }
}
