import { BaseCommand } from '../cli/base-command';

export default class ServerInfo extends BaseCommand {
  static description = 'Display server information';
  static enableJsonFlag = true;

  public async run() {
    console.log('Getting server information');

    await this.connect();
    const { data: versionInfo } = await this.immichApi.serverInfoApi.getServerVersion();

    console.log(versionInfo);
  }
}
