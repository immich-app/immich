import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOriginalFileNameFromEXIFTable1681158048419 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    UPDATE assets a
      SET "originalFileName" = (select e."imageName"
                                from exif e
                                where e."assetId" = a.id)
      where a."originalFileName" IS NULL
         or a."originalFileName" = '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // noop
  }
}
