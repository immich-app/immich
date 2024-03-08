import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRemovedAssetsSharedLink1702942303661 implements MigrationInterface {
    name = 'FixRemovedAssetsSharedLink1702942303661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab"`);
        await queryRunner.query(`ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab" FOREIGN KEY ("sharedLinksId") REFERENCES "shared_links"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab"`);
        await queryRunner.query(`ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab" FOREIGN KEY ("sharedLinksId") REFERENCES "shared_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
