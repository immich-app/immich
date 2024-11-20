import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveStrictKeywordFromEarthFunction1732128889378 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION ll_to_earth_public(latitude double precision, longitude double precision) RETURNS public.earth PARALLEL SAFE IMMUTABLE LANGUAGE SQL AS $$
            SELECT public.cube(public.cube(public.cube(public.earth()*cos(radians(latitude))*cos(radians(longitude))),public.earth()*cos(radians(latitude))*sin(radians(longitude))),public.earth()*sin(radians(latitude)))::public.earth
        $$`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION ll_to_earth_public(latitude double precision, longitude double precision) RETURNS public.earth PARALLEL SAFE IMMUTABLE STRICT LANGUAGE SQL AS $$
            SELECT public.cube(public.cube(public.cube(public.earth()*cos(radians(latitude))*cos(radians(longitude))),public.earth()*cos(radians(latitude))*sin(radians(longitude))),public.earth()*sin(radians(latitude)))::public.earth
        $$`);
  }
}
