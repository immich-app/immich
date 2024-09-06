import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetStackTable1705197515600 implements MigrationInterface {
  name = 'CreateAssetStackTable1705197515600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // create table
    await queryRunner.query(
      `CREATE TABLE "asset_stack" (
       "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
       "primaryAssetId" uuid NOT NULL,
       CONSTRAINT "REL_91704e101438fd0653f582426d" UNIQUE ("primaryAssetId"),
       CONSTRAINT "PK_74a27e7fcbd5852463d0af3034b" PRIMARY KEY ("id"))`,
    );

    // create stacks
    await queryRunner.query(
      `INSERT INTO "asset_stack" ("primaryAssetId")
       SELECT DISTINCT("stackParentId" )
       FROM "assets"
       WHERE "stackParentId" IS NOT NULL;`,
    );

    // add "stackId"
    await queryRunner.query(`ALTER TABLE "assets" ADD COLUMN "stackId" uuid`);

    // set "stackId" for parents
    await queryRunner.query(
      `UPDATE "assets"
       SET "stackId" = "asset_stack"."id"
       FROM "asset_stack"
       WHERE "assets"."id" = "asset_stack"."primaryAssetId"`,
    );

    // set "stackId" for children
    await queryRunner.query(
      `UPDATE "assets"
       SET "stackId" = "asset_stack"."id"
       FROM "asset_stack"
       WHERE "assets"."stackParentId" = "asset_stack"."primaryAssetId"`,
    );

    // update constraints
    await queryRunner.query(`DROP INDEX "IDX_b463c8edb01364bf2beba08ef1"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_b463c8edb01364bf2beba08ef19"`);
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "FK_f15d48fa3ea5e4bda05ca8ab207" FOREIGN KEY ("stackId") REFERENCES "asset_stack"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_stack" ADD CONSTRAINT "FK_91704e101438fd0653f582426dc" FOREIGN KEY ("primaryAssetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // drop "stackParentId"
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "stackParentId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // add "stackParentId"
    await queryRunner.query(`ALTER TABLE "assets" ADD COLUMN "stackParentId" uuid`);

    // set "stackParentId" for parents
    await queryRunner.query(
      `UPDATE "assets"
       SET "stackParentId" = "asset_stack"."primaryAssetId"
       FROM "asset_stack"
       WHERE "assets"."stackId" = "asset_stack"."id" and "assets"."id" != "asset_stack"."primaryAssetId"`,
    );

    // update constraints
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "FK_b463c8edb01364bf2beba08ef19" FOREIGN KEY ("stackParentId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_b463c8edb01364bf2beba08ef1" ON "assets" ("stackParentId") `);
    await queryRunner.query(`ALTER TABLE "asset_stack" DROP CONSTRAINT "FK_91704e101438fd0653f582426dc"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_f15d48fa3ea5e4bda05ca8ab207"`);

    // drop table
    await queryRunner.query(`DROP TABLE "asset_stack"`);

    // drop "stackId"
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "stackId"`);
  }
}
