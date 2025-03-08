import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAssetAndUserCascadeConditions1741280328985 implements MigrationInterface {
  name = 'FixAssetAndUserCascadeConditions1741280328985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE TRIGGER assets_delete_audit
      AFTER DELETE ON assets
      REFERENCING OLD TABLE AS OLD
      FOR EACH STATEMENT
      WHEN (pg_trigger_depth() = 0)
      EXECUTE FUNCTION assets_delete_audit();`);
    await queryRunner.query(`
      CREATE OR REPLACE TRIGGER users_delete_audit
      AFTER DELETE ON users
      REFERENCING OLD TABLE AS OLD
      FOR EACH STATEMENT
      WHEN (pg_trigger_depth() = 0)
      EXECUTE FUNCTION users_delete_audit();`);
    await queryRunner.query(`
      CREATE OR REPLACE TRIGGER partners_delete_audit
      AFTER DELETE ON partners
      REFERENCING OLD TABLE AS OLD
      FOR EACH STATEMENT
      WHEN (pg_trigger_depth() = 0)
      EXECUTE FUNCTION partners_delete_audit();`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE TRIGGER assets_delete_audit
      AFTER DELETE ON assets
      REFERENCING OLD TABLE AS OLD
      FOR EACH STATEMENT
      EXECUTE FUNCTION assets_delete_audit();`);
    await queryRunner.query(`
      CREATE OR REPLACE TRIGGER users_delete_audit
      AFTER DELETE ON users
      REFERENCING OLD TABLE AS OLD
      FOR EACH STATEMENT
      EXECUTE FUNCTION users_delete_audit();`);
    await queryRunner.query(`
      CREATE OR REPLACE TRIGGER partners_delete_audit
      AFTER DELETE ON partners
      REFERENCING OLD TABLE AS OLD
      FOR EACH STATEMENT
      EXECUTE FUNCTION partners_delete_audit();`);
  }
}
