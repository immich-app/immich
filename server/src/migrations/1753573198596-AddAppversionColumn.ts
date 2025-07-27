import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppversionColumn1753573198596 implements MigrationInterface {
    name = 'AddAppversionColumn1753573198596';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "appVersion" character varying DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "appVersion"`);
    }
}

