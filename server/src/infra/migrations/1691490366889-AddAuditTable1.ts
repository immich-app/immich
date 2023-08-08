import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditTable11691490366889 implements MigrationInterface {
    name = 'AddAuditTable11691490366889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit" RENAME COLUMN "onwerId" TO "ownerId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit" RENAME COLUMN "ownerId" TO "onwerId"`);
    }

}
