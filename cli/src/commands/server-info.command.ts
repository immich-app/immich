import { BaseCommand } from './base-command';

export class ServerInfoCommand extends BaseCommand {
  public async run() {
    const api = await this.connect();
    const versionInfo = await api.getServerVersion();
    const mediaTypes = await api.getSupportedMediaTypes();
    const statistics = await api.getAssetStatistics();

    console.log(`Server Version: ${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`);
    console.log(`Image Types: ${mediaTypes.image.map((extension) => extension.replace('.', ''))}`);
    console.log(`Video Types: ${mediaTypes.video.map((extension) => extension.replace('.', ''))}`);
    console.log(
      `Statistics:\n  Images: ${statistics.images}\n  Videos: ${statistics.videos}\n  Total: ${statistics.total}`,
    );
  }
}
