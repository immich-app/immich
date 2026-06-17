import 'package:drift/drift.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/app_metadata_key.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

import 'generated/schema.dart';
import 'generated/schema_v31.dart' as v31;

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

  group('data migrations', () {
    test('v31->v32 backfills the migration', () async {
      final schema = await verifier.schemaAt(31);

      final oldDb = v31.DatabaseAtV31(schema.newConnection());
      await oldDb.into(oldDb.storeEntity).insert(v31.StoreEntityCompanion.insert(id: 0, intValue: const Value(28)));
      await oldDb.close();

      final db = Drift(schema.newConnection());
      await verifier.migrateAndValidate(db, 32);

      final cursor = await (db.appMetadataEntity.select()..where((tbl) => tbl.key.equals(AppMetadataKey.version.name)))
          .map((row) => row.value)
          .getSingleOrNull();
      expect(cursor, '28');

      await db.close();
    });

    test('v31->v32 writes no row when the legacy store has none', () async {
      final schema = await verifier.schemaAt(31);

      final db = Drift(schema.newConnection());
      await verifier.migrateAndValidate(db, 32);

      final rows = await db.appMetadataEntity.select().get();
      expect(rows, isEmpty);

      await db.close();
    });
  });
}
