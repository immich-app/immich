import { MigrationInterface, QueryRunner } from "typeorm"

export class DefaultStorageTemplateOnForExistingInstallations1703288449127 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const adminCount = await queryRunner.query(`SELECT COUNT(*) FROM users WHERE "isAdmin" = true`)
        if(adminCount[0].count > 0) {
          await queryRunner.query(`INSERT INTO system_config (key, value) VALUES ('storageTemplate.enabled', 'true')`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DELETE FROM system_config WHERE key = 'storageTemplate.enabled'`)
    }

}
