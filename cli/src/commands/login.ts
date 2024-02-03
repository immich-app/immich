import { BaseCommand } from './base-command.js';

export class LoginCommand extends BaseCommand {
  public async run(instanceUrl: string, apiKey: string): Promise<void> {
    await this.sessionService.login(instanceUrl, apiKey);
  }
}
