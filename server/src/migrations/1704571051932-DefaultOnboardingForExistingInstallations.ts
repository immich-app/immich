import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultOnboardingForExistingInstallations1704571051932 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminCount = await queryRunner.query(`SELECT COUNT(*) FROM users WHERE "isAdmin" = true`);
    if (adminCount[0].count > 0) {
      await queryRunner.query(`INSERT INTO system_metadata (key, value) VALUES ($1, $2)`, [
        'admin-onboarding',
        String.raw`"{\"isOnboarded\":true}"`,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM system_metadata WHERE key = 'admin-onboarding'`);
  }
}
