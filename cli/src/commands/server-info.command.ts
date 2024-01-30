import { BaseCommand } from './base-command';

export class ServerInfoCommand extends BaseCommand {
  public async run() {
    await this.connect();
    const { data: versionInfo } = await this.immichApi.serverInfoApi.getServerVersion();
    const { data: mediaTypes } = await this.immichApi.serverInfoApi.getSupportedMediaTypes();
    const { data: statistics } = await this.immichApi.assetApi.getAssetStatistics();

    console.log(`Server Version: ${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`);
    console.log(`Image Types: ${mediaTypes.image.map((extension) => extension.replace('.', ''))}`);
    console.log(`Video Types: ${mediaTypes.video.map((extension) => extension.replace('.', ''))}`);
    console.log(
      `Statistics:\n  Images: ${statistics.images}\n  Videos: ${statistics.videos}\n  Total: ${statistics.total}`,
    );
  }
}
