import { MigrationInterface, QueryRunner } from "typeorm";

export class AdddInTimelineToPartnersTable1699562570201 implements MigrationInterface {
    name = 'AdddInTimelineToPartnersTable1699562570201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" ADD "inTimeline" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "inTimeline"`);
    }

}
