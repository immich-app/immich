import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnassignFace1697272818851 implements MigrationInterface {
  name = 'UnassignFace1697272818851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE asset_faces RENAME COLUMN "personId" TO id;`);
    await queryRunner.query(`ALTER TABLE asset_faces ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(), ALTER COLUMN "id" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE asset_faces DROP CONSTRAINT "FK_95ad7106dd7b484275443f580f9";`);
    await queryRunner.query(`ALTER TABLE asset_faces ADD COLUMN "personId" uuid;`);
    await queryRunner.query(`ALTER TABLE asset_faces ADD CONSTRAINT FK_xcpv88uznujgzbsvyvs4od67ui FOREIGN KEY ("personId") REFERENCES person("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await queryRunner.query(`UPDATE asset_faces SET "personId" = id;`);
    await queryRunner.query(`ALTER TABLE asset_faces DROP CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c";`);
    await queryRunner.query(`ALTER TABLE asset_faces ADD CONSTRAINT FK_67cmoiacdzi2d4rrszubchg6db FOREIGN KEY ("assetId") REFERENCES assets("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE asset_faces DROP CONSTRAINT FK_67cmoiacdzi2d4rrszubchg6db;`);
    await queryRunner.query(`ALTER TABLE asset_faces ADD CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c" FOREIGN KEY ("assetId") REFERENCES assets("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    await queryRunner.query(`ALTER TABLE asset_faces DROP CONSTRAINT FK_xcpv88uznujgzbsvyvs4od67ui;`);
    await queryRunner.query(`ALTER TABLE asset_faces DROP COLUMN "personId";`);
    await queryRunner.query(`ALTER TABLE asset_faces ADD CONSTRAINT "FK_95ad7106dd7b484275443f580f9" FOREIGN KEY ("id") REFERENCES person("id") ON DELETE CASCADE ON UPDATECASCADE;`);
    await queryRunner.query(`ALTER TABLE asset_faces ALTER COLUMN id DROP DEFAULT;`)
    await queryRunner.query(`ALTER TABLE asset_faces RENAME COLUMN id TO "personId";`);
  }
}
