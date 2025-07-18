import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'change-media-location',
  description: 'Change database file paths to align with a new media location',
})
export class ChangeMediaLocationCommand extends CommandRunner {
  constructor(
    private service: CliService,
    private inquirer: InquirerService,
  ) {
    super();
  }

  private async showSamplePaths(hint?: string) {
    hint = hint ? ` (${hint})` : '';

    const paths = await this.service.getSampleFilePaths();
    if (paths.length > 0) {
      let message = `  Examples from the database${hint}:\n`;
      for (const path of paths) {
        message += `  - ${path}\n`;
      }

      console.log(`\n${message}`);
    }
  }

  async run(): Promise<void> {
    try {
      await this.showSamplePaths();

      const { oldValue, newValue } = await this.inquirer.ask<{ oldValue: string; newValue: string }>(
        'prompt-media-location',
        {},
      );

      const success = await this.service.migrateFilePaths({
        oldValue,
        newValue,
        confirm: async ({ sourceFolder, targetFolder }) => {
          console.log(`
  Previous value: ${oldValue}
  Current value:  ${newValue}

  Changing  from "${sourceFolder}/*" to "${targetFolder}/*"
`);

          const { value: confirmed } = await this.inquirer.ask<{ value: boolean }>('prompt-confirm-move', {});
          return confirmed;
        },
      });

      const successMessage = `Matching database file paths were updated successfully! 🎉

  You may now set IMMICH_MEDIA_LOCATION=${newValue} and restart!

  (please remember to update applicable volume mounts e.g
    services:
      immich-server:
        ...
        volumes:
          - \${UPLOAD_LOCATION}:/usr/src/app/upload
        ...
  )`;

      console.log(`\n  ${success ? successMessage : 'No rows were updated'}\n`);

      await this.showSamplePaths('after');
    } catch (error) {
      console.error(error);
      console.error('Unable to update database file paths.');
    }
  }
}

const currentValue = process.env.IMMICH_MEDIA_LOCATION || '';

const makePrompt = (which: string) => {
  return `Enter the ${which} value of IMMICH_MEDIA_LOCATION:${currentValue ? ` [${currentValue}]` : ''}`;
};

@QuestionSet({ name: 'prompt-media-location' })
export class PromptMediaLocationQuestions {
  @Question({ message: makePrompt('previous'), name: 'oldValue' })
  oldValue(value: string) {
    return value || currentValue;
  }

  @Question({ message: makePrompt('new'), name: 'newValue' })
  newValue(value: string) {
    return value || currentValue;
  }
}

@QuestionSet({ name: 'prompt-confirm-move' })
export class PromptConfirmMoveQuestions {
  @Question({
    message: 'Do you want to proceed? [Y/n]',
    name: 'value',
  })
  value(value: string): boolean {
    return ['yes', 'y'].includes((value || 'y').toLowerCase());
  }
}
