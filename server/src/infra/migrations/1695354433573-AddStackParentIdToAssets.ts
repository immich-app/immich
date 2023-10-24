import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStackParentIdToAssets1695354433573 implements MigrationInterface {
    name = 'AddStackParentIdToAssets1695354433573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "stackParentId" uuid`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_b463c8edb01364bf2beba08ef19" FOREIGN KEY ("stackParentId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_b463c8edb01364bf2beba08ef19"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "stackParentId"`);
    }

}
