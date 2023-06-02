import { MigrationInterface, QueryRunner } from "typeorm"

export class AddThumbhashColumn1685546571785 implements MigrationInterface {
    name = 'AddThumbhashColumn1685546571785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "thumbhash" character varying DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "thumbhash"`);
    }

}
