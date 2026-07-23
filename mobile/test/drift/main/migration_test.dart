// dart format width=80
// ignore_for_file: unused_local_variable, unused_import
import 'package:drift/drift.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

import 'generated/schema.dart';
import 'generated/schema_v1.dart' as v1;
import 'generated/schema_v2.dart' as v2;
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

  group('migration from v31 to v32', () {
    test('clamps timestamps outside the SQLite-supported range', () async {
      final schema = await verifier.schemaAt(31);

      final oldDb = v31.DatabaseAtV31(schema.newConnection());
      await oldDb.customStatement(
        "INSERT INTO local_asset_entity (id, name, type, created_at, updated_at, adjustment_time) "
        "VALUES ('asset-1', 'a.jpg', 0, '+275760-09-13T00:00:00.000Z', '-000001-01-01T00:00:00.000Z', '+275760-09-13T00:00:00.000Z'), "
        "('asset-2', 'b.jpg', 0, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z')",
      );
      await oldDb.customStatement(
        "INSERT INTO local_album_entity (id, name, updated_at, backup_selection) "
        "VALUES ('album-1', 'album', '+275760-09-13T00:00:00.000Z', 0)",
      );
      await oldDb.close();

      final db = Drift(schema.newConnection());
      await verifier.migrateAndValidate(db, 32);

      final clamped = await db
          .customSelect(
            "SELECT created_at, updated_at, adjustment_time FROM local_asset_entity WHERE id = 'asset-1'",
          )
          .getSingle();
      expect(clamped.read<String>('created_at'), '9999-12-31T00:00:00.000Z');
      expect(clamped.read<String>('updated_at'), '0001-01-01T00:00:00.000Z');
      expect(clamped.readNullable<String>('adjustment_time'), null);

      final untouched = await db
          .customSelect(
            "SELECT created_at, updated_at, adjustment_time FROM local_asset_entity WHERE id = 'asset-2'",
          )
          .getSingle();
      expect(untouched.read<String>('created_at'), '2025-01-01T00:00:00.000Z');
      expect(untouched.read<String>('updated_at'), '2025-01-01T00:00:00.000Z');
      expect(
        untouched.readNullable<String>('adjustment_time'),
        '2025-01-01T00:00:00.000Z',
      );

      final album = await db
          .customSelect(
            "SELECT updated_at FROM local_album_entity WHERE id = 'album-1'",
          )
          .getSingle();
      expect(album.read<String>('updated_at'), '9999-12-31T00:00:00.000Z');

      await db.close();
    });
  });
}
