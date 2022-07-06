import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdminConfigTable1665540663419 implements MigrationInterface {
    name = 'CreateAdminConfigTable1665540663419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "admin_config" ("key" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_aab69295b445016f56731f4d535" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "admin_config"`);
    }

}
