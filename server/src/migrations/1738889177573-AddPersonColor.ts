import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPersonColor1738889177573 implements MigrationInterface {
    name = 'AddPersonColor1738889177573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ADD "color" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "color"`);
    }

}
