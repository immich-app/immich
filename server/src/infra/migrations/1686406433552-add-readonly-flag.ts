import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReadonlyFlag1686406433552 implements MigrationInterface {
    name = 'AddReadonlyFlag1686406433552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isReadOnly" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isReadOnly"`);
    }

}
