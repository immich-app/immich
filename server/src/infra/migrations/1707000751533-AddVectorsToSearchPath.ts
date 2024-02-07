import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVectorsToSearchPath1707000751533 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const res = await queryRunner.query(`SELECT current_database() as db`);
    const databaseName = res[0]['db'];
    await queryRunner.query(`ALTER DATABASE ${databaseName} SET search_path TO "$user", public, vectors`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const databaseName = await queryRunner.query(`SELECT current_database()`);
    await queryRunner.query(`ALTER DATABASE ${databaseName} SET search_path TO "$user", public`);
  }
}
