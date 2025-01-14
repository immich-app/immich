import { Inject, Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from 'node:child_process';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IProcessRepository } from 'src/interfaces/process.interface';
import { StorageRepository } from 'src/repositories/storage.repository';

@Injectable()
export class ProcessRepository implements IProcessRepository {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(StorageRepository.name);
  }

  spawn(command: string, args: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams {
    return spawn(command, args, options);
  }
}
