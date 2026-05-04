// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

import 'generated/schema.dart';
import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;
import 'generated/schema_v23.dart' as v23;

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  late SchemaVerifier verifier;

  setUpAll(() {
    verifier = SchemaVerifier(GeneratedHelper());
  });

  group('simple database migrations', () {
    // These simple tests verify all possible schema updates with a simple (no
    // data) migration. This is a quick way to ensure that written database
    // migrations properly alter the schema.
    const versions = GeneratedHelper.versions;
    for (final (i, fromVersion) in versions.indexed) {
      group('from $fromVersion', () {
        for (final toVersion in versions.skip(i + 1)) {
          test('to $toVersion', () async {
            final schema = await verifier.schemaAt(fromVersion);
            final db = Drift(schema.newConnection());
            await verifier.migrateAndValidate(db, toVersion);
            await db.close();
          });
        }
      });
    }
  });

  // The schema-only test above confirms the DDL is correct. This data
  // migration smoke test locks in the runtime contract: existing v23 rows
  // survive the upgrade, foreign keys still check out, and the new v24
  // objects (library_entity, shared_space_library_entity,
  // idx_remote_asset_library_created) exist and are usable.
  //
  // This is the path existing app users will hit when they update. If the
  // from23To24 step ever drops a column, breaks an FK, or fails to create
  // an index, this is where it surfaces BEFORE we ship a broken upgrade.
  //
  // Note: we use `customStatement` for INSERTs instead of Drift's typed
  // `into(...).insert(...)` because the generated schema_vN.dart files
  // only contain the raw TableInfo definitions, not the Data/Companion
  // classes needed for typed inserts. Raw SQL is the lowest common
  // denominator across schema versions.
  group('gallery-fork: from23To24 data migration', () {
    test('preserves existing v23 data and materializes new v24 objects', () async {
      final schema = await verifier.schemaAt(23);
      final oldDb = Drift(schema.newConnection());

      // Seed v23 with a user row and a remote_asset_entity row. Both must
      // survive the upgrade intact.
      await oldDb.customStatement('''
        INSERT INTO user_entity (id, name, email, has_profile_image, profile_changed_at, avatar_color)
        VALUES ('user-pre-upgrade', 'Pre Upgrade', 'pre@upgrade.test', 0, '2026-04-01T00:00:00.000', 0)
      ''');
      await oldDb.customStatement('''
        INSERT INTO remote_asset_entity
        (id, checksum, name, owner_id, type, created_at, updated_at, visibility)
        VALUES ('asset-pre-upgrade', 'chk-pre', 'pre.jpg', 'user-pre-upgrade', 0,
                '2026-04-01T00:00:00.000', '2026-04-01T00:00:00.000', 0)
      ''');
      await oldDb.close();

      // Run the real migration via the production Drift class.
      final migratedDb = Drift(schema.newConnection());
      await verifier.migrateAndValidate(
        migratedDb,
        GeneratedHelper.versions.last,
      );

      // 1. Existing user row survives.
      final userCount = await migratedDb
          .customSelect(
            "SELECT COUNT(*) AS c FROM user_entity WHERE id = 'user-pre-upgrade'",
          )
          .getSingle();
      expect(userCount.data['c'], 1);

      // 2. Existing asset row survives.
      final assetCount = await migratedDb
          .customSelect(
            "SELECT COUNT(*) AS c FROM remote_asset_entity WHERE id = 'asset-pre-upgrade'",
          )
          .getSingle();
      expect(assetCount.data['c'], 1);

      // 3. New tables exist and are empty.
      expect(await migratedDb.libraryEntity.select().get(), isEmpty);
      expect(await migratedDb.sharedSpaceLibraryEntity.select().get(), isEmpty);

      // 4. The new idx_remote_asset_library_created index exists in
      // sqlite_master. (We ask SQLite directly because there's no Drift
      // API to enumerate indexes.)
      final indexRows = await migratedDb
          .customSelect(
            "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_remote_asset_library_created'",
          )
          .get();
      expect(
        indexRows,
        hasLength(1),
        reason: 'idx_remote_asset_library_created must exist after upgrade',
      );

      // 5. PRAGMA foreign_key_check: no broken FKs anywhere.
      await migratedDb.customStatement('PRAGMA foreign_keys = ON');
      final fkErrors = await migratedDb
          .customSelect('PRAGMA foreign_key_check')
          .get();
      expect(
        fkErrors,
        isEmpty,
        reason: 'foreign_key_check should be empty post-upgrade',
      );

      // 6. Sanity: the new tables are writable AND the hard FK on
      // library.ownerId enforces referential integrity.
      await migratedDb.customStatement('''
        INSERT INTO library_entity (id, name, owner_id, created_at, updated_at)
        VALUES ('post-upgrade-lib', 'Post', 'user-pre-upgrade',
                '2026-04-10T00:00:00.000', '2026-04-10T00:00:00.000')
      ''');
      final libRows = await migratedDb.libraryEntity.select().get();
      expect(libRows, hasLength(1));

      // 7. Inserting a library with an unknown ownerId should fail FK
      // check. We expect an exception from the INSERT.
      await expectLater(
        migratedDb.customStatement('''
          INSERT INTO library_entity (id, name, owner_id, created_at, updated_at)
          VALUES ('broken-lib', 'Broken', 'user-does-not-exist',
                  '2026-04-10T00:00:00.000', '2026-04-10T00:00:00.000')
        '''),
        throwsA(anything),
      );

      await migratedDb.close();
    });

    test(
      'populated library_id on a v23 asset survives the upgrade unchanged',
      () async {
        // remote_asset_entity.library_id has existed since v23 — the
        // from23To24 step only adds the new TABLES and the composite index
        // idx_remote_asset_library_created. Assert that an asset row with a
        // non-null library_id from v23 still has that library_id after the
        // upgrade, and that the new composite index doesn't break the row.
        final schema = await verifier.schemaAt(23);
        final oldDb = Drift(schema.newConnection());
        await oldDb.customStatement('''
        INSERT INTO user_entity (id, name, email, has_profile_image, profile_changed_at, avatar_color)
        VALUES ('u1', 'n', 'n@n.n', 0, '2026-04-01T00:00:00.000', 0)
      ''');
        await oldDb.customStatement('''
        INSERT INTO remote_asset_entity
        (id, checksum, name, owner_id, type, created_at, updated_at, visibility, library_id)
        VALUES ('lib-asset', 'chk-lib', 'lib.jpg', 'u1', 0,
                '2026-04-01T00:00:00.000', '2026-04-01T00:00:00.000', 0, 'legacy-lib-id')
      ''');
        await oldDb.close();

        final migratedDb = Drift(schema.newConnection());
        await verifier.migrateAndValidate(
          migratedDb,
          GeneratedHelper.versions.last,
        );

        final row = await migratedDb
            .customSelect(
              "SELECT library_id FROM remote_asset_entity WHERE id = 'lib-asset'",
            )
            .getSingle();
        expect(row.data['library_id'], 'legacy-lib-id');

        // The composite index is usable — EXPLAIN QUERY PLAN returns a
        // plan that mentions the index name on a library_id+created_at
        // filtered lookup.
        final plan = await migratedDb
            .customSelect(
              "EXPLAIN QUERY PLAN SELECT * FROM remote_asset_entity WHERE library_id = 'legacy-lib-id' ORDER BY created_at DESC",
            )
            .get();
        final planText = plan.map((r) => r.data['detail'] ?? '').join(' | ');
        expect(
          planText,
          contains('idx_remote_asset_library_created'),
          reason:
              'query planner should use the new composite index for (library_id, created_at DESC) lookups',
        );

        await migratedDb.close();
      },
    );
  });

  test(
    'gallery-fork: from24To25 creates reverse shared-space timeline indexes',
    () async {
      final schema = await verifier.schemaAt(24);
      final db = Drift(schema.newConnection());

      await verifier.migrateAndValidate(db, GeneratedHelper.versions.last);

      final indexes = await db.customSelect('''
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (
              'idx_shared_space_asset_asset_space',
              'idx_shared_space_library_library_space'
            )
          ORDER BY name
          ''').get();

      expect(indexes.map((row) => row.data['name']), [
        'idx_shared_space_asset_asset_space',
        'idx_shared_space_library_library_space',
      ]);

      await db.close();
    },
  );
}
