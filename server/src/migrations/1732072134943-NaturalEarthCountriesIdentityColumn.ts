import { MigrationInterface, QueryRunner } from 'typeorm';

export class NaturalEarthCountriesIdentityColumn1732072134943 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE naturalearth_countries ALTER id DROP DEFAULT`);
    await queryRunner.query(`DROP SEQUENCE naturalearth_countries_id_seq`);
    await queryRunner.query(`ALTER TABLE naturalearth_countries ALTER id ADD GENERATED ALWAYS AS IDENTITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE naturalearth_countries ALTER id DROP GENERATED`);
    await queryRunner.query(`CREATE SEQUENCE naturalearth_countries_id_seq`);
    await queryRunner.query(
      `ALTER TABLE naturalearth_countries ALTER id SET DEFAULT nextval('naturalearth_countries_id_seq'::regclass)`,
    );
  }
}
