import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMemoryShowHideDates1739824470990 implements MigrationInterface {
    name = 'AddMemoryShowHideDates1739824470990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memories" ADD "showAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "memories" ADD "hideAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memories" DROP COLUMN "hideAt"`);
        await queryRunner.query(`ALTER TABLE "memories" DROP COLUMN "showAt"`);
    }

}
