import { MigrationInterface, QueryRunner } from "typeorm";

export class PeopleSmartAlbums1712765110263 implements MigrationInterface {
    name = 'PeopleSmartAlbums1712765110263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "albums_people_person" ("albumId" uuid NOT NULL, "personId" uuid NOT NULL, CONSTRAINT "PK_4b37c28a95f7671a5c79af03679" PRIMARY KEY ("albumId", "personId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bcb91af6801260a75588be0c13" ON "albums_people_person" ("albumId") `);
        await queryRunner.query(`CREATE INDEX "IDX_338236e069eb5e1a4d675a1303" ON "albums_people_person" ("personId") `);
        await queryRunner.query(`ALTER TABLE "albums" ADD "peopleTogether" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "albums_people_person" ADD CONSTRAINT "FK_bcb91af6801260a75588be0c13e" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "albums_people_person" ADD CONSTRAINT "FK_338236e069eb5e1a4d675a1303d" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_people_person" DROP CONSTRAINT "FK_338236e069eb5e1a4d675a1303d"`);
        await queryRunner.query(`ALTER TABLE "albums_people_person" DROP CONSTRAINT "FK_bcb91af6801260a75588be0c13e"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "peopleTogether"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_338236e069eb5e1a4d675a1303"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bcb91af6801260a75588be0c13"`);
        await queryRunner.query(`DROP TABLE "albums_people_person"`);
    }

}
