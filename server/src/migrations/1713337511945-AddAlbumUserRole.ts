import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlbumUserRole1713337511945 implements MigrationInterface {
    name = 'AddAlbumUserRole1713337511945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD "role" character varying NOT NULL DEFAULT 'editor'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP COLUMN "role"`);
    }

}
