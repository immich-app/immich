import { BaseCommand } from './base-command';

export class LogoutCommand extends BaseCommand {
  public static readonly description = 'Logout and remove persisted credentials';
  public async run(): Promise<void> {
    await this.sessionService.logout();
  }
}
