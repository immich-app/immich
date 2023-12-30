import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultOnboardingForExistingInstallations1703950964498 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminCount = await queryRunner.query(`SELECT COUNT(*) FROM users WHERE "isAdmin" = true`);
    if (adminCount[0].count > 0) {
      await queryRunner.query(`UPDATE users SET "showOnboarding" = false WHERE "isAdmin" = true`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE users SET "showOnboarding" = true WHERE "isAdmin" = true`);
  }
}
