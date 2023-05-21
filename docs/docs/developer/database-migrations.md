# Database Migrations

After making any changes in the `server/libs/database/src/entities`, a database migration need to run in order to register the changes in the database. Follow the steps below to create a new migration.

1. Run the command

```bash
npm run typeorm:migrations:generate ./libs/infra/src/<migration-name>
```

2. Check if the migration file makes sense.
3. Move the migration file to folder `server/libs/database/src/migrations` in your code editor.

The server will automatically detect `*.ts` file changes and restart. Part of the server start-up process includes running any new migrations, so it will be applied immediately.
