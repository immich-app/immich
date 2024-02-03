import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVectorsToSearchPath1707000751533 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER DATABASE immich SET search_path TO "$user", public, vectors`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER DATABASE immich SET search_path TO "$user", public`);
  }
}
