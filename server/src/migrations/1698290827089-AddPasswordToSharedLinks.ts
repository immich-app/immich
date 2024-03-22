import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordToSharedLinks1698290827089 implements MigrationInterface {
    name = 'AddPasswordToSharedLinks1698290827089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" ADD "password" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" DROP COLUMN "password"`);
    }

}
