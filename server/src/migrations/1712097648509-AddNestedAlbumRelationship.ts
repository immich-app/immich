import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNestedAlbumRelationship1712097648509 implements MigrationInterface {
    name = 'AddNestedAlbumRelationship1712097648509'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sub_albums" ("albumsId_1" uuid NOT NULL, "albumsId_2" uuid NOT NULL, CONSTRAINT "PK_09146cc3ec21c9848e9e9ed8a81" PRIMARY KEY ("albumsId_1", "albumsId_2"))`);
        await queryRunner.query(`CREATE INDEX "IDX_444ea96aed836f9638deeb51c6" ON "sub_albums" ("albumsId_1") `);
        await queryRunner.query(`CREATE INDEX "IDX_b5db48ee618abd330e04c0b5aa" ON "sub_albums" ("albumsId_2") `);
        await queryRunner.query(`ALTER TABLE "sub_albums" ADD CONSTRAINT "FK_444ea96aed836f9638deeb51c60" FOREIGN KEY ("albumsId_1") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sub_albums" ADD CONSTRAINT "FK_b5db48ee618abd330e04c0b5aa1" FOREIGN KEY ("albumsId_2") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sub_albums" DROP CONSTRAINT "FK_b5db48ee618abd330e04c0b5aa1"`);
        await queryRunner.query(`ALTER TABLE "sub_albums" DROP CONSTRAINT "FK_444ea96aed836f9638deeb51c60"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5db48ee618abd330e04c0b5aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_444ea96aed836f9638deeb51c6"`);
        await queryRunner.query(`DROP TABLE "sub_albums"`);
    }

}
