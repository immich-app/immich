import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOfflineField1725282595231 implements MigrationInterface {
    name = 'RemoveOfflineField1725282595231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isOffline"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isOffline" boolean NOT NULL DEFAULT false`);
    }

}
