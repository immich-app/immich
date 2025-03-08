import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsersAuditTable1740064899123 implements MigrationInterface {
    name = 'AddUsersAuditTable1740064899123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_updated_at_asc_id_asc" ON "users" ("updatedAt" ASC, "id" ASC);`)
        await queryRunner.query(`CREATE TABLE "users_audit" ("id" SERIAL NOT NULL, "userId" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e9b2bdfd90e7eb5961091175180" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_audit_deleted_at_asc_user_id_asc" ON "users_audit" ("deletedAt" ASC, "userId" ASC);`)
        await queryRunner.query(`CREATE OR REPLACE FUNCTION users_delete_audit() RETURNS TRIGGER AS
          $$
           BEGIN
            INSERT INTO users_audit ("userId")
            SELECT "id"
            FROM OLD;
            RETURN NULL;
           END;
          $$ LANGUAGE plpgsql`
        );
        await queryRunner.query(`CREATE OR REPLACE TRIGGER users_delete_audit
           AFTER DELETE ON users
           REFERENCING OLD TABLE AS OLD
           FOR EACH STATEMENT
           EXECUTE FUNCTION users_delete_audit();
        `);
    }

  public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER users_delete_audit`);
        await queryRunner.query(`DROP FUNCTION users_delete_audit`);
        await queryRunner.query(`DROP TABLE "users_audit"`);
    }

}
