import { BaseCommand } from '../../cli/base-command';

export default class LoginKey extends BaseCommand {
  public async run(instanceUrl: string, apiKey: string): Promise<void> {
    console.log('Executing API key auth flow...');

    await this.sessionService.keyLogin(instanceUrl, apiKey);
  }
}
