import { MigrationInterface, QueryRunner } from "typeorm"

export class AddPersonBirthDate1692112147855 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "person" ADD "birthDate" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "birthDate"`);
    }

}
