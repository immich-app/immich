import { GitHubRelease, IServerInfoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerInfoRepository implements IServerInfoRepository {
  async getGitHubRelease(): Promise<GitHubRelease> {
    const response = await fetch('https://api.github.com/repos/immich-app/immich/releases/latest');
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub release');
    }
    return response.json();
  }
}
