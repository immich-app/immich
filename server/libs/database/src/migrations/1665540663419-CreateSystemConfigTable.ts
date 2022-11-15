import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemConfigTable1665540663419 implements MigrationInterface {
  name = 'CreateSystemConfigTable1665540663419';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "system_config" ("key" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_aab69295b445016f56731f4d535" PRIMARY KEY ("key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "system_config"`);
  }
}
