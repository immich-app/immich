import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNplFromSystemConfig1730227312171 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        update system_metadata
        set value = value #- '{ffmpeg,npl}'
        where key = 'system-config' and value->'ffmpeg'->'npl' is not null`);
  }

  public async down(): Promise<void> {}
}
