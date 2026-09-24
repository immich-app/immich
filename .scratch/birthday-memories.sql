--------------------------------------------------------------------------------
-- Repoint a library at one person's birthday, so `memory-create` builds a
-- Birthday memory with real content.
--
-- DEV/TEST ONLY. Rewrites asset dates and inserts faces. Throwaway DB only.
--
--   psql -U postgres -d immich -f birthday-memories.sql
--   then: POST /api/jobs  { "name": "memory-create" }
--------------------------------------------------------------------------------

BEGIN;

CREATE TEMP TABLE cfg ON COMMIT DROP AS
SELECT
  'admin@immich.app'::text AS owner_email,
  'Alex'::text             AS person_name,
  40                       AS birth_year_offset,  -- born this many years ago, today
  5                        AS anniversary_years,  -- spread assets over the last N birthdays
  NULL::int                AS max_assets;         -- NULL = every eligible asset

CREATE TEMP TABLE target ON COMMIT DROP AS
SELECT u.id AS owner_id, p."personGroupId" AS person_group_id
FROM "user" u
JOIN person p ON p."ownerId" = u.id
WHERE u.email = (SELECT owner_email FROM cfg)
  AND p.name = (SELECT person_name FROM cfg);

DO $$
BEGIN
  IF (SELECT count(*) FROM target) <> 1 THEN
    RAISE EXCEPTION 'expected 1 person, found %. fix owner_email / person_name in cfg',
      (SELECT count(*) FROM target);
  END IF;
END $$;

--------------------------------------------------------------------------------
-- 1. birthday = today's month/day, N years back
--    PersonRepository.forBirthdayMemories also needs: name <> '', not hidden,
--    birth year < this year.
--------------------------------------------------------------------------------
UPDATE person p
SET "birthDate" = (CURRENT_DATE - make_interval(years => (SELECT birth_year_offset FROM cfg)))::date,
    "isHidden"  = false
FROM target t
WHERE p."ownerId" = t.owner_id
  AND p."personGroupId" = t.person_group_id;

--------------------------------------------------------------------------------
-- 2. the assets to hijack: timeline, alive, and carrying a preview file
--    (MemoryRepository.personAssets requires all three)
--------------------------------------------------------------------------------
CREATE TEMP TABLE picked ON COMMIT DROP AS
SELECT a.id, row_number() OVER (ORDER BY a."fileCreatedAt" DESC) AS rn
FROM asset a
JOIN target t ON a."ownerId" = t.owner_id
WHERE a.visibility = 'timeline'
  AND a."deletedAt" IS NULL
  AND EXISTS (SELECT 1 FROM asset_file f WHERE f."assetId" = a.id AND f.type = 'preview')
LIMIT (SELECT coalesce(max_assets, 2147483647) FROM cfg);

--------------------------------------------------------------------------------
-- 3. put the person's face on every one of them
--------------------------------------------------------------------------------
INSERT INTO asset_face ("assetId", "personGroupId", "sourceType", "isVisible")
SELECT p.id, t.person_group_id, 'manual', true
FROM picked p
CROSS JOIN target t
WHERE NOT EXISTS (
  SELECT 1 FROM asset_face af
  WHERE af."assetId" = p.id AND af."personGroupId" = t.person_group_id
);

-- any pre-existing faces must be visible and undeleted to count
UPDATE asset_face af
SET "deletedAt" = NULL, "isVisible" = true
FROM target t
WHERE af."personGroupId" = t.person_group_id
  AND (af."deletedAt" IS NOT NULL OR af."isVisible" IS NOT TRUE);

--------------------------------------------------------------------------------
-- 4. deal the assets round-robin onto the last N birthdays
--    noon UTC so (localDateTime at time zone 'UTC')::date is unambiguous
--------------------------------------------------------------------------------
UPDATE asset a
SET "localDateTime" = s.ts, "fileCreatedAt" = s.ts
FROM (
  SELECT p.id,
         (((CURRENT_DATE - make_interval(years => 1 + ((p.rn - 1) % (SELECT anniversary_years FROM cfg))::int))::date
           + time '12:00') AT TIME ZONE 'UTC') AS ts
  FROM picked p
) s
WHERE a.id = s.id;

--------------------------------------------------------------------------------
-- 5. clear the way for a fresh run
--    the job skips any target date <= memories-state.lastOnThisDayDate
--------------------------------------------------------------------------------
DELETE FROM memory m USING target t WHERE m."ownerId" = t.owner_id;  -- memory_asset cascades
DELETE FROM system_metadata WHERE key = 'memories-state';

--------------------------------------------------------------------------------
-- 6. what the server will now see (assets per birthday year)
--------------------------------------------------------------------------------
SELECT date_part('year', (a."localDateTime" AT TIME ZONE 'UTC')::date)::int AS year,
       count(*) AS assets
FROM asset a
JOIN target t ON a."ownerId" = t.owner_id
WHERE a.visibility = 'timeline'
  AND a."deletedAt" IS NULL
  AND EXISTS (
    SELECT 1 FROM asset_face af
    WHERE af."assetId" = a.id AND af."personGroupId" = t.person_group_id
      AND af."deletedAt" IS NULL AND af."isVisible" IS TRUE
  )
  AND EXISTS (SELECT 1 FROM asset_file f WHERE f."assetId" = a.id AND f.type = 'preview')
  AND date_part('month', (a."localDateTime" AT TIME ZONE 'UTC')::date)::int = date_part('month', CURRENT_DATE)::int
  AND date_part('day',   (a."localDateTime" AT TIME ZONE 'UTC')::date)::int = date_part('day', CURRENT_DATE)::int
GROUP BY 1
ORDER BY 1 DESC;

COMMIT;
