import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTagUniqueness1725023079109 implements MigrationInterface {
    name = 'FixTagUniqueness1725023079109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "UQ_d090e09fe86ebe2ec0aec27b451"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "UQ_79d6f16e52bb2c7130375246793" UNIQUE ("userId", "value")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "UQ_79d6f16e52bb2c7130375246793"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "UQ_d090e09fe86ebe2ec0aec27b451" UNIQUE ("value")`);
    }

}
