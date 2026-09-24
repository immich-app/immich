-- Put assets on the top-3 named people's birthday anniversaries so the
-- memory-create job has something to build from. Writes NO memory rows.
BEGIN;

CREATE TABLE IF NOT EXISTS zz_birthday_backup (
  "assetId" uuid PRIMARY KEY,
  "localDateTime" timestamptz,
  "fileCreatedAt" timestamptz
);

CREATE TEMP TABLE cfg ON COMMIT DROP AS
SELECT '5216ce70-bbfb-4c5b-88ee-197a33235362'::uuid AS owner_id,
       5 AS anniversary_years,
       5 AS assets_per_year;

-- scarcest first, so a shared asset is claimed by whoever can least afford to lose it
CREATE TEMP TABLE people ON COMMIT DROP AS
SELECT * FROM (VALUES
  ('663f9d98-14a9-49fb-80f8-a12a5e369ac4'::uuid, 1),  -- Amie,    41 assets
  ('c389748d-d1ab-4a18-8692-a28080079a14'::uuid, 2),  -- Paulina, 56
  ('73bbef45-4642-4908-87c0-43168cd4c956'::uuid, 3)   -- Alex,   102
) AS t(person, ord);

CREATE TEMP TABLE claim ("assetId" uuid PRIMARY KEY, person uuid, year int) ON COMMIT DROP;

DO $$
DECLARE
  p record;
  quota int := (SELECT anniversary_years * assets_per_year FROM cfg);
  owner uuid := (SELECT owner_id FROM cfg);
  span int := (SELECT anniversary_years FROM cfg);
BEGIN
  FOR p IN SELECT person FROM people ORDER BY ord LOOP
    INSERT INTO claim ("assetId", person, year)
    SELECT picked.id, p.person, date_part('year', CURRENT_DATE)::int - span + ((picked.rn - 1) % span)
    FROM (
      SELECT asset.id, row_number() OVER (ORDER BY asset."fileCreatedAt" DESC) AS rn
      FROM asset
      WHERE asset."ownerId" = owner
        AND asset.visibility = 'timeline'
        AND asset."deletedAt" IS NULL
        AND EXISTS (SELECT 1 FROM asset_file f WHERE f."assetId" = asset.id AND f.type = 'preview')
        AND EXISTS (
          SELECT 1 FROM asset_face af
          WHERE af."assetId" = asset.id AND af."personGroupId" = p.person
            AND af."deletedAt" IS NULL AND af."isVisible" IS TRUE
        )
        AND NOT EXISTS (SELECT 1 FROM claim c WHERE c."assetId" = asset.id)
      ORDER BY asset."fileCreatedAt" DESC
      LIMIT quota
    ) picked;
  END LOOP;
END $$;

INSERT INTO zz_birthday_backup ("assetId", "localDateTime", "fileCreatedAt")
SELECT asset.id, asset."localDateTime", asset."fileCreatedAt"
FROM asset JOIN claim ON claim."assetId" = asset.id
ON CONFLICT ("assetId") DO NOTHING;

UPDATE asset
SET "localDateTime" = s.ts, "fileCreatedAt" = s.ts
FROM (
  SELECT c."assetId",
         ((make_date(c.year,
                     date_part('month', p."birthDate")::int,
                     date_part('day', p."birthDate")::int) + time '12:00') AT TIME ZONE 'UTC') AS ts
  FROM claim c
  JOIN person p ON p."personGroupId" = c.person AND p."ownerId" = (SELECT owner_id FROM cfg)
) s
WHERE asset.id = s."assetId";

-- let the job run again: it skips any target at or before memories-state.lastOnThisDayDate
DELETE FROM memory WHERE "ownerId" = (SELECT owner_id FROM cfg);
DELETE FROM system_metadata WHERE key = 'memories-state';

SELECT p.name, c.year, count(*) AS assets
FROM claim c
JOIN person p ON p."personGroupId" = c.person AND p."ownerId" = (SELECT owner_id FROM cfg)
GROUP BY 1, 2
ORDER BY 1, 2;

COMMIT;
