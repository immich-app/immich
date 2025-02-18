import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViewCount1739916305466 implements MigrationInterface {
    name = 'AddViewCount1739916305466'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" ADD "viewCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" DROP COLUMN "viewCount"`);
    }

}
