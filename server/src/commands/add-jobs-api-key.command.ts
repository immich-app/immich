import { Command, CommandRunner } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'add-jobs-api-key',
  description: 'Generate and return a new API key for accessing jobs API',
  arguments: '<name> [userId]',
})
export class AddJobsApiKeyCommand extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [name, userId] = passedParams;
    if (!name) {
      console.error('Error: API key name is required.');
      return;
    }

    try {
      const resolvedUserId = userId || (await this.service.getFirstAdminUserId());
      const apiKey = await this.service.generateApiKey(name, resolvedUserId);
      console.log(apiKey);
    } catch (error) {
      console.error(error);
      console.error('Unable to generate API key');
    }
  }
}
