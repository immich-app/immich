import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobStatus1699345863886 implements MigrationInterface {
    name = 'AddJobStatus1699345863886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "asset_job_status" ("assetId" uuid NOT NULL, "facesRecognizedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_420bec36fc02813bddf5c8b73d4" PRIMARY KEY ("assetId"))`);
        await queryRunner.query(`ALTER TABLE "asset_job_status" ADD CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_job_status" DROP CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4"`);
        await queryRunner.query(`DROP TABLE "asset_job_status"`);
    }

}
