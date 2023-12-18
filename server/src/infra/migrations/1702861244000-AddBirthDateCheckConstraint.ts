import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBirthDateCheckConstraint1702861244000 implements MigrationInterface {
    name = 'AddBirthDateConstraint1702861244000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "CHK_576d7b55bf87e098ae4e0372989" CHECK ("birthDate" <= CURRENT_DATE)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "CHK_576d7b55bf87e098ae4e0372989"`);
    }
}
