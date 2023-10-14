import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnassignFace1697272818851 implements MigrationInterface {
  name = 'UnassignFace1697272818851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP CONSTRAINT "PK_bf339a24070dac7e71304ec530a"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD COLUMN "id" UUID DEFAULT uuid_generate_v4() NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD CONSTRAINT "PK_6df76ab2eb6f5b57b7c2f1fc684" PRIMARY KEY ("id")`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP CONSTRAINT "FK_95ad7106dd7b484275443f580f9"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ALTER COLUMN "personId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD CONSTRAINT "FK_95ad7106dd7b484275443f580f9" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP CONSTRAINT "PK_6df76ab2eb6f5b57b7c2f1fc684"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP CONSTRAINT "FK_95ad7106dd7b484275443f580f9"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ALTER COLUMN "personId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD CONSTRAINT "FK_95ad7106dd7b484275443f580f9" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD  CONSTRAINT "PK_bf339a24070dac7e71304ec530a" PRIMARY KEY ("assetId", "personId")`);
  }
}
