import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetStackTable1705197515600 implements MigrationInterface {
    name = 'CreateAssetStackTable1705197515600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_b463c8edb01364bf2beba08ef19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b463c8edb01364bf2beba08ef1"`);
        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "stackParentId" TO "stackId"`);
        await queryRunner.query(`CREATE TABLE "asset_stack" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "primaryAssetId" uuid NOT NULL, CONSTRAINT "REL_91704e101438fd0653f582426d" UNIQUE ("primaryAssetId"), CONSTRAINT "PK_74a27e7fcbd5852463d0af3034b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_f15d48fa3ea5e4bda05ca8ab207" FOREIGN KEY ("stackId") REFERENCES "asset_stack"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_stack" ADD CONSTRAINT "FK_91704e101438fd0653f582426dc" FOREIGN KEY ("primaryAssetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_stack" DROP CONSTRAINT "FK_91704e101438fd0653f582426dc"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_f15d48fa3ea5e4bda05ca8ab207"`);
        await queryRunner.query(`DROP TABLE "asset_stack"`);
        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "stackId" TO "stackParentId"`);
        await queryRunner.query(`CREATE INDEX "IDX_b463c8edb01364bf2beba08ef1" ON "assets" ("stackParentId") `);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_b463c8edb01364bf2beba08ef19" FOREIGN KEY ("stackParentId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
