import { MigrationInterface, QueryRunner } from "typeorm";

export class recyclebin1674155742930 implements MigrationInterface {
    name = 'recyclebin1674155742930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isDeleted"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "deletedAt"`);
    }

}
