import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexForAlbumInSharedLinkTable1677535643119 implements MigrationInterface {
    name = 'AddIndexForAlbumInSharedLinkTable1677535643119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_sharedlink_albumId" ON "shared_links" ("albumId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_sharedlink_albumId"`);
    }

}
