import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from 'node:child_process';

@Injectable()
export class ProcessRepository {
  spawn(command: string, args: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams {
    return spawn(command, args, options);
  }
}
