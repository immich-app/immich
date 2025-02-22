import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from 'node:child_process';
import { LoggingRepository } from 'src/repositories/logging.repository';

@Injectable()
export class ProcessRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(ProcessRepository.name);
  }

  spawn(command: string, args: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams {
    return spawn(command, args, options);
  }
}
