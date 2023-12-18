import { MigrationInterface, QueryRunner } from "typeorm";

export class NullifyFutureBirthDates1702861244000 implements MigrationInterface {
    name = 'NullifyFutureBirthDates1702861244000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "person" SET "birthDate" = NULL WHERE "birthDate" > CURRENT_DATE;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // The down method is left empty as we cannot revert the nullified dates
    }

}
