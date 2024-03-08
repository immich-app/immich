import { MigrationInterface, QueryRunner } from "typeorm";

export class NullifyFutureBirthDatesAndAddCheckConstraint1702938928766 implements MigrationInterface {
    name = 'NullifyFutureBirthDatesAndAddCheckConstraint1702938928766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "person" SET "birthDate" = NULL WHERE "birthDate" > CURRENT_DATE;`);
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "CHK_b0f82b0ed662bfc24fbb58bb45" CHECK ("birthDate" <= CURRENT_DATE)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // The down method cannot revert the nullified dates
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "CHK_b0f82b0ed662bfc24fbb58bb45"`);
    }

}
