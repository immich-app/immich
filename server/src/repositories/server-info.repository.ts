import { Injectable } from '@nestjs/common';
import { GitHubRelease, IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { Instrumentation } from 'src/utils/instrumentation';

@Instrumentation()
@Injectable()
export class ServerInfoRepository implements IServerInfoRepository {
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
}
