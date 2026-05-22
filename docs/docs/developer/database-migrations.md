# Database Migrations

After making any changes in the `server/src/schema`, a database migration need to run in order to register the changes in the database. Follow the steps below to create a new migration.

1. Run the command

```bash
pnpm run migrations:generate <migration-name>
```

2. Check if the migration file makes sense.
3. Move the migration file to folder `./server/src/schema/migrations` in your code editor.

The server will automatically detect `*.ts` file changes and restart. Part of the server start-up process includes running any new migrations, so it will be applied immediately.

## Reverting a Migration

If you need to undo the most recently applied migration—for example, when developing or testing on schema changes—run:

```bash
pnpm run migrations:revert
```

This command rolls back the latest migration and brings the database schema back to its previous state.
