import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccentColorToUser1685539788734 implements MigrationInterface {
    name = 'AddAccentColorToUser1685539788734'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "accentColor" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ADD "darkAccentColor" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accentColor"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "darkAccentColor"`);
    }

}
