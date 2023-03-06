import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExifTable1645130817965 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        create table if not exists exif
        (
            id                 serial
                constraint "PK_28663352d85078ad0046dafafaa"
                    primary key,
            "assetId"          uuid not null
                constraint "REL_c0117fdbc50b917ef9067740c4"
                    unique
                constraint "FK_c0117fdbc50b917ef9067740c44"
                    references assets
                    on delete cascade,
            make               varchar,
            model              varchar,
            "imageName"        varchar,
            "exifImageWidth"   integer,
            "exifImageHeight"  integer,
            "fileSizeInByte"   integer,
            orientation        varchar,
            "dateTimeOriginal" timestamp with time zone,
            "modifyDate"       timestamp with time zone,
            "lensModel"        varchar,
            "fNumber"          double precision,
            "focalLength"      double precision,
            iso                integer,
            "exposureTime"     double precision,
            latitude           double precision,
            longitude          double precision
        );

        create unique index if not exists "IDX_c0117fdbc50b917ef9067740c4" on exif ("assetId");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop table exif`);
  }
}
