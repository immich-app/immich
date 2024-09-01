import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetFolderRelation1724802318088 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create or replace function file_parent(path text) returns text as $$
        begin
            return array_to_string(trim_array(string_to_array(path, '/'), 1), '/');
        end;
        $$
        language plpgsql
        parallel safe
        immutable`);

    // this is so folders are sorted numerically instead of lexicographically, e.g. 1, 2, 10 instead of 1, 10, 2
    await queryRunner.query(`create collation numeric (provider = icu, locale = 'en-u-kn-true')`);

    await queryRunner.query(`
        create table asset_folders (
            id   uuid primary key default gen_random_uuid(),
            path text not null collate numeric
        )`);

    await queryRunner.query(`drop index "IDX_4d66e76dada1ca180f67a205dc"`); // unused index on "originalFileName"

    await queryRunner.query(`alter table assets alter column "originalFileName" set data type varchar collate numeric`);

    // to make sure postgres chooses the right plan
    await queryRunner.query(`alter table asset_folders alter column path set statistics 500`);

    await queryRunner.query(`
        alter table assets
            add column "folderId" uuid
                constraint "FK_8ca281adee62839a757ef23ca15"
                references asset_folders (id)
                on update cascade`);

    await queryRunner.query(`
        with inserted as (
            insert into asset_folders (path)
            select distinct file_parent("originalPath")
            from assets
            returning id, path
        )
        update assets
        set "folderId" = inserted.id
        from inserted
        where file_parent("originalPath") = inserted.path`);

    await queryRunner.query(`alter table assets alter column "folderId" set not null`);

    await queryRunner.query(`create unique index idx_asset_folders_path on asset_folders (path collate numeric)`);

    await queryRunner.query(`create index idx_assets_folder_id_originalfilename on assets ("folderId", "originalFileName" collate numeric)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop function file_parent`);

    await queryRunner.query(`drop collation numeric`);

    await queryRunner.query(`alter table assets drop column "folderId"`);

    await queryRunner.query(`drop table asset_folders`);
  }
}
