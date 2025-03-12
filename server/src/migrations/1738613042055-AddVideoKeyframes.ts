import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoKeyframes1738613042055 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE assets
      ADD COLUMN "keyframes" FLOAT[]`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE assets
      DROP COLUMN "keyframes"`);
  }

}
