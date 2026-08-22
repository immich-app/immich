import 'package:drift/drift.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/app_metadata_key.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

import 'generated/schema.dart';
import 'generated/schema_v32.dart' as v32;

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
    test('v32->v33 backfills the migration', () async {
      const version = 28;
      final schema = await verifier.schemaAt(32);

      final oldDb = v32.DatabaseAtV32(schema.newConnection());
      await oldDb
          .into(oldDb.storeEntity)
          .insert(v32.StoreEntityCompanion.insert(id: 0, intValue: const Value(version)));
      await oldDb.close();

      final db = Drift(schema.newConnection());
      await verifier.migrateAndValidate(db, 33);

      final cursor = await (db.appMetadataEntity.select()..where((tbl) => tbl.key.equals(AppMetadataKey.version.name)))
          .map((row) => row.value)
          .getSingleOrNull();
      expect(cursor, version.toString());

      await db.close();
    });

    test('v32->v33 writes no row when the legacy store has none', () async {
      final schema = await verifier.schemaAt(32);

      final db = Drift(schema.newConnection());
      await verifier.migrateAndValidate(db, 33);

      final rows = await db.appMetadataEntity.select().get();
      expect(rows, isEmpty);

      await db.close();
    });
  });
}
