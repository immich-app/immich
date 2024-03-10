import { MigrationInterface, QueryRunner } from "typeorm";

export class AscendingOrderAlbum1710082044505 implements MigrationInterface {
    name = 'AscendingOrderAlbum1710082044505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD "ascendingOrder" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "ascendingOrder"`);
    }

}
