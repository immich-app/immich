import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAssetAlbumIdSequence1656888591977 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter sequence asset_shared_album_id_seq rename to asset_album_id_seq;`);
    await queryRunner.query(
      `alter table asset_album alter column id set default nextval('asset_album_id_seq'::regclass);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter sequence asset_album_id_seq rename to asset_shared_album_id_seq;`);
    await queryRunner.query(
      `alter table asset_album alter column id set default nextval('asset_shared_album_id_seq'::regclass);`,
    );
  }
}
