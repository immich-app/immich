import { BaseCommand } from './base-command';

export class LoginCommand extends BaseCommand {
  public async run(instanceUrl: string, apiKey: string): Promise<void> {
    await this.sessionService.login(instanceUrl, apiKey);
  }
}
