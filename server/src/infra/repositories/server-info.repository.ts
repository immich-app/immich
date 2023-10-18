import { IServerInfoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

export type GithubRelease = {
  tag_name: string;
};

@Injectable()
export class ServerInfoRepository implements IServerInfoRepository {
  async getLatestAvailableVersion(): Promise<GithubRelease> {
    const { data } = await axios.get<GithubRelease>('https://api.github.com/repos/immich-app/immich/releases/latest');
    return data;
  }
}
