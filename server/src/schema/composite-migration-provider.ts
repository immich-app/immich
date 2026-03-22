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

    // Warn about duplicate migration names across folders
    if (results.length > 1) {
      const seen = new Set<string>();
      for (const migrations of results) {
        for (const name of Object.keys(migrations)) {
          if (seen.has(name)) {
            console.warn(`Migration name collision detected: "${name}" exists in multiple migration folders`);
          }
          seen.add(name);
        }
      }
    }

    return Object.assign({}, ...results);
  }
}
