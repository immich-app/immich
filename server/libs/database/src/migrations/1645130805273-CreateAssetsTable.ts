import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetsTable1645130805273 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table if not exists assets
        (
            id              uuid    default uuid_generate_v4() not null
                constraint "PK_da96729a8b113377cfb6a62439c"
                    primary key,
            "deviceAssetId" varchar                            not null,
            "userId"        varchar                            not null,
            "deviceId"      varchar                            not null,
            type            varchar                            not null,
            "originalPath"  varchar                            not null,
            "resizePath"    varchar,
            "createdAt"     varchar                            not null,
            "modifiedAt"    varchar                            not null,
            "isFavorite"    boolean default false              not null,
            "mimeType"      varchar,
            duration        varchar,
            constraint "UQ_b599ab0bd9574958acb0b30a90e"
                unique ("deviceAssetId", "userId", "deviceId")
        );
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop table assets`);
  }
}
