import { MigrationInterface, QueryRunner } from "typeorm";

export class Infra1689281196844 implements MigrationInterface {
    name = 'Infra1689281196844'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ADD "isHidden" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "isHidden"`);
    }

}
