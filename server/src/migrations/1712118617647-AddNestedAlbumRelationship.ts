import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNestedAlbumRelationship1712118617647 implements MigrationInterface {
    name = 'AddNestedAlbumRelationship1712118617647'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sub_albums" DROP CONSTRAINT "FK_b0b854d4c62ed6a4a46cff3b6b9"`);
        await queryRunner.query(`ALTER TABLE "sub_albums" DROP CONSTRAINT "FK_6aa094f6f0d888c90c418a14d70"`);
        await queryRunner.query(`CREATE INDEX "IDX_b0b854d4c62ed6a4a46cff3b6b" ON "sub_albums" ("childId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6aa094f6f0d888c90c418a14d7" ON "sub_albums" ("parentId") `);
        await queryRunner.query(`ALTER TABLE "sub_albums" ADD CONSTRAINT "FK_6aa094f6f0d888c90c418a14d70" FOREIGN KEY ("parentId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_albums" ADD CONSTRAINT "FK_b0b854d4c62ed6a4a46cff3b6b9" FOREIGN KEY ("childId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sub_albums" DROP CONSTRAINT "FK_b0b854d4c62ed6a4a46cff3b6b9"`);
        await queryRunner.query(`ALTER TABLE "sub_albums" DROP CONSTRAINT "FK_6aa094f6f0d888c90c418a14d70"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6aa094f6f0d888c90c418a14d7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0b854d4c62ed6a4a46cff3b6b"`);
        await queryRunner.query(`ALTER TABLE "sub_albums" ADD CONSTRAINT "FK_6aa094f6f0d888c90c418a14d70" FOREIGN KEY ("parentId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_albums" ADD CONSTRAINT "FK_b0b854d4c62ed6a4a46cff3b6b9" FOREIGN KEY ("childId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
