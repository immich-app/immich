import { FileMigrationProvider, Migration, MigrationProvider } from 'kysely';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export class CompositeMigrationProvider implements MigrationProvider {
  private providers: FileMigrationProvider[];

  constructor(folders: string[]) {
    this.providers = folders.map(
      (folder) =>
        new FileMigrationProvider({
          fs: { readdir },
          path: { join },
          migrationFolder: folder,
        }),
    );
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    const results = await Promise.all(this.providers.map((p) => p.getMigrations()));
    return Object.assign({}, ...results);
  }
}
