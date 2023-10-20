import { GitHubRelease, IServerInfoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ServerInfoRepository implements IServerInfoRepository {
  getGitHubRelease(): Promise<GitHubRelease> {
    return axios
      .get<GitHubRelease>('https://api.github.com/repos/immich-app/immich/releases/latest')
      .then((response) => response.data);
  }
}
