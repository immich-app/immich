import { MigrationInterface, QueryRunner } from 'typeorm';

export class NaturalEarthCountriesIdentityColumn1732072134943 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE naturalearth_countries ALTER id DROP DEFAULT`);
    await queryRunner.query(`DROP SEQUENCE naturalearth_countries_id_seq`);
    await queryRunner.query(`ALTER TABLE naturalearth_countries ALTER id ADD GENERATED ALWAYS AS IDENTITY`);

    // same as ll_to_earth, but with explicit schema to avoid weirdness and allow it to work in expression indices
    await queryRunner.query(`
      CREATE FUNCTION ll_to_earth_public(latitude double precision, longitude double precision) RETURNS public.earth PARALLEL SAFE IMMUTABLE STRICT LANGUAGE SQL AS $$
        SELECT public.cube(public.cube(public.cube(public.earth()*cos(radians(latitude))*cos(radians(longitude))),public.earth()*cos(radians(latitude))*sin(radians(longitude))),public.earth()*sin(radians(latitude)))::public.earth
    $$`);

    await queryRunner.query(`ALTER TABLE geodata_places DROP COLUMN "earthCoord"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE naturalearth_countries ALTER id DROP GENERATED`);
    await queryRunner.query(`CREATE SEQUENCE naturalearth_countries_id_seq`);
    await queryRunner.query(
      `ALTER TABLE naturalearth_countries ALTER id SET DEFAULT nextval('naturalearth_countries_id_seq'::regclass)`,
    );
    await queryRunner.query(`DROP FUNCTION ll_to_earth_public`);
    await queryRunner.query(
      `ALTER TABLE "geodata_places" ADD "earthCoord" earth GENERATED ALWAYS AS (ll_to_earth(latitude, longitude)) STORED`,
    );
  }
}
