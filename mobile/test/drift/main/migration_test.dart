// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/utils/migration.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'generated/schema.dart';
import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;

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

  group('v32 group_date backfill', () {
    test(
      'garbage created_at survives migration and is filtered from the timeline',
      () async {
        await initializeDateFormatting();
        final schema = await verifier.schemaAt(31);
        schema.rawDatabase.execute(
          "INSERT INTO local_album_entity (id, name, backup_selection) VALUES ('album-1', 'Camera', 0)",
        );
        schema.rawDatabase.execute(
          "INSERT INTO local_asset_entity (id, name, type, created_at, updated_at) VALUES ('garbage', 'g.jpg', 1, '57780-01-01T00:00:00.000Z', '57780-01-01T00:00:00.000Z')",
        );
        schema.rawDatabase.execute(
          "INSERT INTO local_asset_entity (id, name, type, created_at, updated_at) VALUES ('good', 'ok.jpg', 1, '2026-07-24T10:00:00.000Z', '2026-07-24T10:00:00.000Z')",
        );
        schema.rawDatabase.execute(
          "INSERT INTO local_album_asset_entity (asset_id, album_id) VALUES ('garbage', 'album-1')",
        );
        schema.rawDatabase.execute(
          "INSERT INTO local_album_asset_entity (asset_id, album_id) VALUES ('good', 'album-1')",
        );

        final db = Drift(schema.newConnection());
        await verifier.migrateAndValidate(db, 32);
        await backfillAssetGroupDates(db);

        final repo = DriftTimelineRepository(db);
        final buckets = await repo
            .main(const ['user-1'], GroupAssetsBy.day)
            .bucketSource()
            .first;
        expect(buckets, hasLength(1));
        expect(buckets.single.assetCount, 1);
        expect((buckets.single as TimeBucket).date, DateTime(2026, 7, 24));
        await db.close();
      },
    );

    test('a created_at heal before the backfill lands in the header day', () async {
      await initializeDateFormatting();
      final schema = await verifier.schemaAt(31);
      schema.rawDatabase.execute(
        "INSERT INTO local_album_entity (id, name, backup_selection) VALUES ('album-1', 'Camera', 0)",
      );
      schema.rawDatabase.execute(
        "INSERT INTO local_asset_entity (id, name, type, created_at, updated_at) VALUES ('healed', 'h.jpg', 1, '2027-01-01T00:00:00.000Z', '2026-07-20T10:00:00.000Z')",
      );
      schema.rawDatabase.execute(
        "INSERT INTO local_album_asset_entity (asset_id, album_id) VALUES ('healed', 'album-1')",
      );

      final db = Drift(schema.newConnection());
      await verifier.migrateAndValidate(db, 32);

      await db.customStatement(
        "UPDATE local_asset_entity SET created_at = updated_at WHERE julianday(created_at) > julianday(updated_at)",
      );
      await backfillAssetGroupDates(db);

      final repo = DriftTimelineRepository(db);
      final buckets = await repo
          .main(const ['user-1'], GroupAssetsBy.day)
          .bucketSource()
          .first;
      expect((buckets.single as TimeBucket).date, DateTime(2026, 7, 20));
      await db.close();
    });
  });
}
