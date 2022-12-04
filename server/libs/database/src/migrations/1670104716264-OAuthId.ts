import { MigrationInterface, QueryRunner } from "typeorm";

export class OAuthId1670104716264 implements MigrationInterface {
    name = 'OAuthId1670104716264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "oauthId" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "oauthId"`);
    }

}
