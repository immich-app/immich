import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfigTable1662770847455 implements MigrationInterface {
  name = 'AddConfigTable1662770847455';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "system_config" 
      (
        "id" SERIAL NOT NULL, 
        "category" character varying NOT NULL, 
        "key" character varying NOT NULL, 
        "value" character varying, 
        CONSTRAINT "UQ_5008b06564c4068adb86c7bfcf8" UNIQUE ("key", "category"), 
        CONSTRAINT "PK_db4e70ac0d27e588176e9bb44a0" PRIMARY KEY ("id")
      )
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "system_config"`);
  }
}
