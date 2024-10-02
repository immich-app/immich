import { MigrationInterface, QueryRunner } from "typeorm";

export class AddprofileChangedAt1726491047923 implements MigrationInterface {
    name = 'AddprofileChangedAt1726491047923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "profileChangedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileChangedAt"`);
    }

}
