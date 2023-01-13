import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameIsFirstLoggedInColumn1656338626260 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE users
         RENAME COLUMN "isFirstLoggedIn" to "shouldChangePassword";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
          RENAME COLUMN "shouldChangePassword" to "isFirstLoggedIn";
    `);
  }
}
