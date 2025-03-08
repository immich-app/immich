import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePartnersAuditTable1740739778549 implements MigrationInterface {
    name = 'CreatePartnersAuditTable1740739778549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "partners_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "sharedById" uuid NOT NULL, "sharedWithId" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(), CONSTRAINT "PK_952b50217ff78198a7e380f0359" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_partners_audit_shared_by_id" ON "partners_audit" ("sharedById") `);
        await queryRunner.query(`CREATE INDEX "IDX_partners_audit_shared_with_id" ON "partners_audit" ("sharedWithId") `);
        await queryRunner.query(`CREATE INDEX "IDX_partners_audit_deleted_at" ON "partners_audit" ("deletedAt") `);
        await queryRunner.query(`CREATE OR REPLACE FUNCTION partners_delete_audit() RETURNS TRIGGER AS
              $$
               BEGIN
                INSERT INTO partners_audit ("sharedById", "sharedWithId")
                SELECT "sharedById", "sharedWithId"
                FROM OLD;
                RETURN NULL;
               END;
              $$ LANGUAGE plpgsql`
        );
        await queryRunner.query(`CREATE OR REPLACE TRIGGER partners_delete_audit
               AFTER DELETE ON partners
               REFERENCING OLD TABLE AS OLD
               FOR EACH STATEMENT
               EXECUTE FUNCTION partners_delete_audit();
            `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_partners_audit_deleted_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_partners_audit_shared_with_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_partners_audit_shared_by_id"`);
        await queryRunner.query(`DROP TRIGGER partners_delete_audit`);
        await queryRunner.query(`DROP FUNCTION partners_delete_audit`);
        await queryRunner.query(`DROP TABLE "partners_audit"`);
    }

}
