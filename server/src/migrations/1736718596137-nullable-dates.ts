import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableDates1736718596137 implements MigrationInterface {
    name = 'NullableDates1736718596137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "fileCreatedAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "localDateTime" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "fileModifiedAt" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "fileModifiedAt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "localDateTime" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "fileCreatedAt" SET NOT NULL`);
    }

}
