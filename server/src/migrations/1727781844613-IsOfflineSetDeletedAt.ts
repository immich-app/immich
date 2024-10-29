import { MigrationInterface, QueryRunner } from "typeorm";

export class IsOfflineSetDeletedAt1727781844613 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(
        `UPDATE assets SET "deletedAt" = now() WHERE "isOffline" = true AND "deletedAt" IS NULL`,
      );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(
        `UPDATE assets SET "deletedAt" = null WHERE "isOffline" = true`,
      );
    }
}
