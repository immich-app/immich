import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrivateAlbumPassword1698978434572 implements MigrationInterface {
    name = 'AddPrivateAlbumPassword1698978434572'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "privateAlbumPassword" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "albums" ADD "isPrivate" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "privateAlbumPassword"`);
    }

}
