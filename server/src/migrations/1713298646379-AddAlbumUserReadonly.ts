import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlbumUserReadonly1713298646379 implements MigrationInterface {
    name = 'AddAlbumUserReadonly1713298646379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD "readonly" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ALTER COLUMN "readonly" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP COLUMN "readonly"`);
    }

}
