import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // (#30199) Reverse geocoding now uses the GeoNames names, so rewrite the stored ones
  await sql`
    WITH renames ("old", "new") AS (
      VALUES
        ('Åland Islands', 'Aland Islands'),
        ('Bonaire, Sint Eustatius and Saba', 'Bonaire, Saint Eustatius and Saba'),
        ('Brunei Darussalam', 'Brunei'),
        ('Cape Verde', 'Cabo Verde'),
        ('Cocos (Keeling) Islands', 'Cocos Islands'),
        ('Cote d''Ivoire', 'Ivory Coast'),
        ('Cote D''Ivoire', 'Ivory Coast'),
        ('Curaçao', 'Curacao'),
        ('Czech Republic', 'Czechia'),
        ('Falkland Islands (Malvinas)', 'Falkland Islands'),
        ('Holy See (Vatican City State)', 'Vatican'),
        ('Islamic Republic of Iran', 'Iran'),
        ('Lao People''s Democratic Republic', 'Laos'),
        ('Micronesia, Federated States of', 'Micronesia'),
        ('Moldova, Republic of', 'Moldova'),
        ('Netherlands', 'The Netherlands'),
        ('People''s Republic of China', 'China'),
        ('Republic of The Gambia', 'Gambia'),
        ('Russian Federation', 'Russia'),
        ('Saint Barthélemy', 'Saint Barthelemy'),
        ('Saint Martin (French part)', 'Saint Martin'),
        ('Sint Maarten (Dutch part)', 'Sint Maarten'),
        ('State of Palestine', 'Palestinian Territory'),
        ('Syrian Arab Republic', 'Syria'),
        ('Taiwan, Province of China', 'Taiwan'),
        ('The Republic of North Macedonia', 'North Macedonia'),
        ('Timor-Leste', 'Timor Leste'),
        ('Türkiye', 'Turkey'),
        ('United Republic of Tanzania', 'Tanzania'),
        ('United States of America', 'United States'),
        ('Virgin Islands, British', 'British Virgin Islands'),
        ('Virgin Islands, U.S.', 'U.S. Virgin Islands')
    ),
    exif AS (
      UPDATE "asset_exif"
      SET "country" = renames."new"
      FROM renames
      WHERE "country" = renames."old"
    )
    UPDATE "workflow_step"
    SET "config" = jsonb_set("config", '{region,country}', to_jsonb(renames."new"))
    FROM renames
    WHERE "config"->'region'->>'country' = renames."old"
  `.execute(db);
}

export async function down(): Promise<void> {
  // Not implemented: the old names came from a removed dependency
}
