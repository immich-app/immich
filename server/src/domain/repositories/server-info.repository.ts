import { GithubRelease } from '@app/infra/repositories';

export const IServerInfoRepository = 'IServerInfoRepository';

export interface IServerInfoRepository {
  getLatestAvailableVersion(): Promise<GithubRelease>;
}
