import { Injectable } from '@nestjs/common';
import { exiftool } from 'exiftool-vendored';
import { exec as execCallback } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

export interface GitHubRelease {
  id: number;
  url: string;
  tag_name: string;
  name: string;
  created_at: string;
  published_at: string;
  body: string;
}

export interface ServerBuildVersions {
  nodejs: string;
  ffmpeg: string;
  libvips: string;
  exiftool: string;
  imagemagick: string;
}

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

@Injectable()
export class ServerInfoRepository {
  constructor(
    private configRepository: ConfigRepository,
    private logger: LoggingRepository,
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
