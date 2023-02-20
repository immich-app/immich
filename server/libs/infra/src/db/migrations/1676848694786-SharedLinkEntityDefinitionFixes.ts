import { MigrationInterface, QueryRunner } from "typeorm";

export class SharedLinkEntityDefinitionFixes1676848694786 implements MigrationInterface {
    name = 'SharedLinkEntityDefinitionFixes1676848694786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" ALTER COLUMN "createdAt" DROP DEFAULT`);
    }

}
