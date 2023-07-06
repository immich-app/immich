import { BaseCommand } from '../cli/base-command';

export default class Logout extends BaseCommand {
  public static readonly description = 'Logout and remove persisted credentials';

  public async run(): Promise<void> {
    console.log('Executing logout flow...');

    await this.sessionService.logout();

    console.log('Successfully logged out');
  }
}
