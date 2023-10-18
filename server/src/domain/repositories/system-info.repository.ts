import { GithubRelease } from '@app/infra/repositories';

export const ISystemInfoRepository = 'ISystemInfoRepository';

export interface ISystemInfoRepository {
  getLatestAvailableVersion(): Promise<GithubRelease>;
}
