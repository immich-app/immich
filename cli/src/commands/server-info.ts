import { BaseCommand } from '../cli/base-command';

export class ServerInfo extends BaseCommand {
  public async run() {
    await this.connect();
    const { data: versionInfo } = await this.immichApi.serverInfoApi.getServerVersion();

    console.log(`Server is running version ${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`);

    const { data: supportedmedia } = await this.immichApi.serverInfoApi.getSupportedMediaTypes();

    console.log(`Supported image types: ${supportedmedia.image.map((extension) => extension.replace('.', ''))}`);

    console.log(`Supported video types: ${supportedmedia.video.map((extension) => extension.replace('.', ''))}`);

    const { data: statistics } = await this.immichApi.assetApi.getAssetStatistics();
    console.log(`Images: ${statistics.images}, Videos: ${statistics.videos}, Total: ${statistics.total}`);
  }
}
