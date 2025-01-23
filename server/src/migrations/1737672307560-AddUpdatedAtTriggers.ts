import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtTriggers1737672307560 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create function updated_at()
        returns trigger as $$
        begin
            new."updatedAt" = now();
            return new;
        end;
        $$ language 'plpgsql'`);

    await queryRunner.query(`
        create trigger activity_updated_at
        before update on activity
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger albums_updated_at
        before update on albums
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger api_keys_updated_at
        before update on api_keys
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger asset_files_updated_at
        before update on asset_files
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger assets_updated_at
        before update on assets
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger libraries_updated_at
        before update on libraries
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger memories_updated_at
        before update on memories
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger partners_updated_at
        before update on partners
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger person_updated_at
        before update on person
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger sessions_updated_at
        before update on sessions
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger tags_updated_at
        before update on tags
        for each row execute procedure updated_at()
    `);

    await queryRunner.query(`
        create trigger users_updated_at
        before update on users
        for each row execute procedure updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop trigger activity_updated_at on activity`);
    await queryRunner.query(`drop trigger albums_updated_at on albums`);
    await queryRunner.query(`drop trigger api_keys_updated_at on api_keys`);
    await queryRunner.query(`drop trigger asset_files_updated_at on asset_files`);
    await queryRunner.query(`drop trigger assets_updated_at on assets`);
    await queryRunner.query(`drop trigger libraries_updated_at on libraries`);
    await queryRunner.query(`drop trigger memories_updated_at on memories`);
    await queryRunner.query(`drop trigger partners_updated_at on partners`);
    await queryRunner.query(`drop trigger person_updated_at on person`);
    await queryRunner.query(`drop trigger sessions_updated_at on sessions`);
    await queryRunner.query(`drop trigger tags_updated_at on tags`);
    await queryRunner.query(`drop trigger users_updated_at on users`);
    await queryRunner.query(`drop function updated_at_trigger`);
  }
}
