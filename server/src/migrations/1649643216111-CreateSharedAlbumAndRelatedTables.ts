import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSharedAlbumAndRelatedTables1649643216111 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create shared_albums
    await queryRunner.query(`
    create table if not exists shared_albums
    (
        id                      uuid                     default uuid_generate_v4()                  not null
            constraint "PK_7f71c7b5bc7c87b8f94c9a93a00"
                primary key,
        "ownerId"               varchar                                                              not null,
        "albumName"             varchar                  default 'Untitled Album'::character varying not null,
        "createdAt"             timestamp with time zone default now()                               not null,
        "albumThumbnailAssetId" varchar
    );
    
    comment on column shared_albums."albumThumbnailAssetId" is 'Asset ID to be used as thumbnail';
    `);

    // Create user_shared_album
    await queryRunner.query(`
    create table if not exists user_shared_album
    (
        id             serial
            constraint "PK_b6562316a98845a7b3e9a25cdd0"
                primary key,
        "albumId"      uuid not null
            constraint "FK_7b3bf0f5f8da59af30519c25f18"
                references shared_albums
                on delete cascade,
        "sharedUserId" uuid not null
            constraint "FK_543c31211653e63e080ba882eb5"
                references users,
        constraint "PK_unique_user_in_album"
            unique ("albumId", "sharedUserId")
    );
    `);

    // Create asset_shared_album
    await queryRunner.query(
      `
      create table if not exists asset_shared_album
      (
          id        serial
              constraint "PK_a34e076afbc601d81938e2c2277"
                  primary key,
          "albumId" uuid not null
              constraint "FK_a8b79a84996cef6ba6a3662825d"
                  references shared_albums
                  on delete cascade,
          "assetId" uuid not null
              constraint "FK_64f2e7d68d1d1d8417acc844a4a"
                  references assets
                  on delete cascade,
          constraint "UQ_a1e2734a1ce361e7a26f6b28288"
              unique ("albumId", "assetId")
      );
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      drop table asset_shared_album;
      drop table user_shared_album;
      drop table shared_albums;
    `);
  }
}
