import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSharedLinkCascade1685044328272 implements MigrationInterface {
    name = 'AddSharedLinkCascade1685044328272'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" DROP CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66"`);
        await queryRunner.query(`ALTER TABLE "shared_links" ADD CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" DROP CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66"`);
        await queryRunner.query(`ALTER TABLE "shared_links" ADD CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
