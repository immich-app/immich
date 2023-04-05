import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRedundantConstraints1680694465853 implements MigrationInterface {
    name = 'RemoveRedundantConstraints1680694465853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "REL_c0117fdbc50b917ef9067740c4"`);
        await queryRunner.query(`ALTER TABLE "smart_info" DROP CONSTRAINT "UQ_5e3753aadd956110bf3ec0244ac"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "smart_info" ADD CONSTRAINT "UQ_5e3753aadd956110bf3ec0244ac" UNIQUE ("assetId")`);
        await queryRunner.query(`ALTER TABLE "exif" ADD CONSTRAINT "REL_c0117fdbc50b917ef9067740c4" UNIQUE ("assetId")`);
    }

}
