import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, fork, spawn, SpawnOptionsWithoutStdio } from 'node:child_process';
import { Duplex } from 'node:stream';

@Injectable()
export class ProcessRepository {
  spawn(command: string, args?: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams {
    return spawn(command, args, options);
  }

  spawnDuplexStream(command: string, args?: readonly string[], options?: SpawnOptionsWithoutStdio): Duplex {
    let stdinClosed = false;
    let drainCallback: undefined | (() => void);

    const process = this.spawn(command, args, options);
    const duplex = new Duplex({
      // duplex -> stdin
      write(chunk, encoding, callback) {
        // drain the input if process dies
        if (stdinClosed) {
          return callback();
        }

        // handle stream backpressure
        if (process.stdin.write(chunk, encoding)) {
          callback();
        } else {
          drainCallback = callback;
          process.stdin.once('drain', () => {
            drainCallback = undefined;
            callback();
          });
        }
      },

      read() {
        // no-op
      },

      final(callback) {
        if (stdinClosed) {
          callback();
        } else {
          process.stdin.end(callback);
        }
      },
    });

    // stdout -> duplex
    process.stdout.on('data', (chunk) => {
      // handle stream backpressure
      if (!duplex.push(chunk)) {
        process.stdout.pause();
      }
    });

    duplex.on('resume', () => process.stdout.resume());

    // end handling
    let stdoutClosed = false;
    function close(error?: Error) {
      stdinClosed = true;

      if (error) {
        duplex.destroy(error);
      } else if (stdoutClosed && typeof process.exitCode === 'number') {
        duplex.push(null);
      }
    }

    process.stdout.on('close', () => {
      stdoutClosed = true;
      close();
    });

    // error handling
    process.on('error', close);
    process.stdout.on('error', close);
    process.stdin.on('error', (error) => {
      if ((error as { code?: 'EPIPE' })?.code === 'EPIPE') {
        try {
          drainCallback!();
        } catch (error) {
          close(error as Error);
        }
      } else {
        close(error);
      }
    });

    let stderr = '';
    process.stderr.on('data', (chunk) => (stderr += chunk));

    process.on('exit', (code) => {
      console.info(`${command} exited (${code})`);

      if (code === 0) {
        close();
      } else {
        close(new Error(`${command} non-zero exit code (${code})\n${stderr}`));
      }
    });

    return Object.assign(duplex, { _process: process });
  }

  fork(...args: Parameters<typeof fork>): ReturnType<typeof fork> {
    return fork(...args);
  }
}
