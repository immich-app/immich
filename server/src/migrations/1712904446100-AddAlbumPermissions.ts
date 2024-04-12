import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlbumPermissions1712904446100 implements MigrationInterface {
    name = 'AddAlbumPermissions1712904446100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD "readonly" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP COLUMN "readonly"`);
    }

}
