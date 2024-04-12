import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlbumPermission1712905775156 implements MigrationInterface {
    name = 'AddAlbumPermission1712905775156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD "readonly" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP COLUMN "readonly"`);
    }

}
