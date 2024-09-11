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

export const IServerInfoRepository = 'IServerInfoRepository';

export interface IServerInfoRepository {
  getGitHubRelease(): Promise<GitHubRelease>;
  getBuildVersions(): Promise<ServerBuildVersions>;
}
