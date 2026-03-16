import { asHuman } from '@immich/sql-tools';
import { Command, CommandRunner } from 'nest-commander';
import { ErrorMessages } from 'src/constants';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'schema-check',
  description: 'Verify database migrations and check for schema drift',
})
export class SchemaCheck extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    try {
      const { migrations, drift } = await this.service.schemaReport();

      if (migrations.every((item) => item.status === 'applied')) {
        console.log('Migrations are up to date');
      } else {
        console.log('Migration issues detected:');
        for (const migration of migrations) {
          switch (migration.status) {
            case 'deleted': {
              console.log(`  - ${migration.name} was applied, but the file no longer exists on disk`);
              break;
            }

            case 'missing': {
              console.log(`  - ${migration.name} exists, but has not been applied to the database`);
              break;
            }
          }
        }
      }

      if (drift.items.length === 0) {
        console.log('\nNo schema drift detected');
      } else {
        console.log(`\n${ErrorMessages.SchemaDrift}`);
        for (const item of drift.items) {
          console.log(`  - ${item.type}: ` + asHuman(item));
        }

        console.log(`

The below SQL is automatically generated and may be helpful for resolving drift. ** Use at your own risk! **

\`\`\`sql
${drift.asSql().join('\n')}
\`\`\`
`);
      }
    } catch (error) {
      console.error(error);
      console.error('Unable to debug migrations');
    }
  }
}
