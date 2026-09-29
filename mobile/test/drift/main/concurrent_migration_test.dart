import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';

import 'generated/schema_v22.dart' as v22;

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late Directory dir;
  late File file;

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('immich_migration_test');
    file = File('${dir.path}/db.sqlite');

    final old = v22.DatabaseAtV22(NativeDatabase(file));
    await old.customStatement('PRAGMA journal_mode = WAL');
    await old.localAssetEntity.insertOne(
      v22.LocalAssetEntityCompanion.insert(id: 'asset', name: 'asset.mp4', type: 0, durationInSeconds: const .new(5)),
    );
    await old.close();
  });

  tearDown(() async => await dir.delete(recursive: true));

  Drift open() =>
      Drift(NativeDatabase.createInBackground(file, setup: (db) => db.execute('PRAGMA busy_timeout = 30000;')));

  test('two isolates migrating the same database concurrently both succeed', () async {
    final first = open();
    final second = open();
    addTearDown(() async {
      await first.close();
      await second.close();
    });

    // Migrations are executed lazily; The below forces both instances to run the migration concurrently
    await Future.wait([first.customSelect('SELECT 1').get(), second.customSelect('SELECT 1').get()]);

    for (final db in [first, second]) {
      final version = await db.customSelect('PRAGMA user_version').getSingle();
      expect(version.read<int>('user_version'), db.schemaVersion);
    }
  });
}
