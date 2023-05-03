import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartnersTable1683301805582 implements MigrationInterface {
    name = 'AddPartnersTable1683301805582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "partners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sharedById" uuid, "sharedWithId" uuid, CONSTRAINT "PK_998645b20820e4ab99aeae03b41" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_7e077a8b70b3530138610ff5e04" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3" FOREIGN KEY ("sharedWithId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_7e077a8b70b3530138610ff5e04"`);
        await queryRunner.query(`DROP TABLE "partners"`);
    }

}
