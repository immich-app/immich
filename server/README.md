## How to run migration

1. Attached to the container shell
2. Run `npm run typeorm -- migration:generate ./libs/database/src/<migration-name> -d libs/database/src/config/database.config.ts`
3. Check if the migration file makes sense
4. Move the migration file to folder `server/libs/database/src/migrations` in your code editor.