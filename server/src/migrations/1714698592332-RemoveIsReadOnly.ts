import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIsReadOnly1714698592332 implements MigrationInterface {
    name = 'RemoveIsReadOnly1714698592332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isReadOnly"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isReadOnly" boolean NOT NULL DEFAULT false`);
    }

}
