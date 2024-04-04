import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClosureAlbumTable1712173905900 implements MigrationInterface {
  name = 'AddClosureAlbumTable1712173905900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "albums_closure" ("id_ancestor" uuid NOT NULL, "id_descendant" uuid NOT NULL, CONSTRAINT "PK_c73b38b33bc7f8a4b2588c573f5" PRIMARY KEY ("id_ancestor", "id_descendant"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a54149056a7a5da2c44d8a65c2" ON "albums_closure" ("id_ancestor") `);
    await queryRunner.query(`CREATE INDEX "IDX_3a2f01ca9d654f90f4a2887a36" ON "albums_closure" ("id_descendant") `);
    await queryRunner.query(`ALTER TABLE "albums" ADD "parentsId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "albums" ADD CONSTRAINT "FK_c619d16fe935e8afd5f9105f31f" FOREIGN KEY ("parentsId") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums_closure" ADD CONSTRAINT "FK_a54149056a7a5da2c44d8a65c22" FOREIGN KEY ("id_ancestor") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums_closure" ADD CONSTRAINT "FK_3a2f01ca9d654f90f4a2887a362" FOREIGN KEY ("id_descendant") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums_closure" DROP CONSTRAINT "FK_3a2f01ca9d654f90f4a2887a362"`);
    await queryRunner.query(`ALTER TABLE "albums_closure" DROP CONSTRAINT "FK_a54149056a7a5da2c44d8a65c22"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_c619d16fe935e8afd5f9105f31f"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "parentsId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3a2f01ca9d654f90f4a2887a36"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a54149056a7a5da2c44d8a65c2"`);
    await queryRunner.query(`DROP TABLE "albums_closure"`);
  }
}
