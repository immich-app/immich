import { MigrationInterface, QueryRunner } from "typeorm";

export class ExifEntityDefinitionFixes1676848629119 implements MigrationInterface {
    name = 'ExifEntityDefinitionFixes1676848629119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "description" SET NOT NULL`);

        await queryRunner.query(`DROP INDEX "IDX_c0117fdbc50b917ef9067740c4"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "PK_28663352d85078ad0046dafafaa"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "FK_c0117fdbc50b917ef9067740c44"`);
        await queryRunner.query(`ALTER TABLE "exif" ADD CONSTRAINT "PK_c0117fdbc50b917ef9067740c44" PRIMARY KEY ("assetId")`);
        await queryRunner.query(`ALTER TABLE "exif" ADD CONSTRAINT "FK_c0117fdbc50b917ef9067740c44" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "description" DROP NOT NULL`);

        await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "FK_c0117fdbc50b917ef9067740c44"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "PK_c0117fdbc50b917ef9067740c44"`);
        await queryRunner.query(`ALTER TABLE "exif" ADD CONSTRAINT "FK_c0117fdbc50b917ef9067740c44" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "exif" ADD CONSTRAINT "PK_28663352d85078ad0046dafafaa" PRIMARY KEY ("id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c0117fdbc50b917ef9067740c4" ON "exif" ("assetId") `);
    }

}
