import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssetAlbumJoinedTable1681041266163 implements MigrationInterface {
  name = 'UpdateAssetAlbumJoinedTable1681041266163';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621"`);
    await queryRunner.query(
      `ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621"`);
    await queryRunner.query(
      `ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
