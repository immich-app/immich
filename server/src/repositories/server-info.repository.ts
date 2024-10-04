import { Inject, Injectable } from '@nestjs/common';
import { exiftool } from 'exiftool-vendored';
import { exec as execCallback } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { GitHubRelease, IServerInfoRepository, ServerBuildVersions } from 'src/interfaces/server-info.interface';
import { Instrumentation } from 'src/utils/instrumentation';

const exec = promisify(execCallback);
const maybeFirstLine = async (command: string): Promise<string> => {
  try {
    const { stdout } = await exec(command);
    return stdout.trim().split('\n')[0] || '';
  } catch {
    return '';
  }
};

type BuildLockfile = {
  sources: Array<{ name: string; version: string }>;
  packages: Array<{ name: string; version: string }>;
};

const getLockfileVersion = (name: string, lockfile?: BuildLockfile) => {
  if (!lockfile) {
    return;
  }

  const items = [...(lockfile.sources || []), ...(lockfile?.packages || [])];
  const item = items.find((item) => item.name === name);
  return item?.version;
};

@Instrumentation()
@Injectable()
export class ServerInfoRepository implements IServerInfoRepository {
  constructor(
    @Inject(IConfigRepository) private configRepository: IConfigRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(ServerInfoRepository.name);
  }

  async getGitHubRelease(): Promise<GitHubRelease> {
    try {
      const response = await fetch('https://api.github.com/repos/immich-app/immich/releases/latest');

      if (!response.ok) {
        throw new Error(`GitHub API request failed with status ${response.status}: ${await response.text()}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch GitHub release: ${error}`);
    }
  }

  async getBuildVersions(): Promise<ServerBuildVersions> {
    const { nodeVersion, resourcePaths } = this.configRepository.getEnv();

    const [nodejsOutput, ffmpegOutput, magickOutput] = await Promise.all([
      maybeFirstLine('node --version'),
      maybeFirstLine('ffmpeg -version'),
      maybeFirstLine('convert --version'),
    ]);

    const lockfile = await readFile(resourcePaths.lockFile)
      .then((buffer) => JSON.parse(buffer.toString()))
      .catch(() => this.logger.warn(`Failed to read ${resourcePaths.lockFile}`));

    return {
      nodejs: nodejsOutput || nodeVersion || '',
      exiftool: await exiftool.version(),
      ffmpeg: getLockfileVersion('ffmpeg', lockfile) || ffmpegOutput.replaceAll('ffmpeg version', '') || '',
      libvips: getLockfileVersion('libvips', lockfile) || sharp.versions.vips,
      imagemagick:
        getLockfileVersion('imagemagick', lockfile) || magickOutput.replaceAll('Version: ImageMagick ', '') || '',
    };
  }
}
