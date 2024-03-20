import { MigrationInterface, QueryRunner } from "typeorm";

export class AscendingOrderAlbum1710182081326 implements MigrationInterface {
    name = 'AscendingOrderAlbum1710182081326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD "order" character varying NOT NULL DEFAULT 'desc'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "order"`);
    }

}
