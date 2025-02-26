import 'dart:io';

import 'package:collection/collection.dart';
// ignore: import_rule_drift
import 'package:drift/drift.dart';
// ignore: import_rule_drift
import 'package:drift/native.dart';
import 'package:faker/faker.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/repositories/asset.repository.dart';
import 'package:immich_mobile/domain/repositories/asset_isar.repository.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:isar/isar.dart';
// import 'package:isar/isar.dart';
import 'package:sqlite3/sqlite3.dart';

import 'test_utils.dart';

List<Asset> _generateAssets(int count) {
  final assets = <Asset>[];
  final faker = Faker();
  for (int i = 0; i < count; i++) {
    assets.add(Asset(
      id: i,
      name: 'Asset $i',
      hash: faker.guid.guid(),
      height: faker.randomGenerator.integer(1000),
      width: faker.randomGenerator.integer(1000),
      type: faker.randomGenerator.element(AssetType.values),
      createdTime: faker.date.dateTime(),
      modifiedTime: faker.date.dateTime(),
      duration: faker.randomGenerator.integer(100),
      localId: faker.guid.guid(),
      remoteId: faker.guid.guid(),
      livePhotoVideoId: faker.guid.guid(),
    ));
  }
  return assets;
}

Future<void> _benchDriftInsertsBatched({
  required String name,
  required Iterable<List<Asset>> assets,
  required DriftDatabaseRepository db,
}) async {
  final repo = AssetRepository(db: db);
  final sp = Stopwatch()..start();
  for (final chunk in assets) {
    await repo.upsertAll(chunk);
  }
  print('$name - ${sp.elapsed}');
}

Future<void> _benchIsarInsertsBatched({
  required String name,
  required Iterable<List<Asset>> assets,
  required Isar db,
}) async {
  final repo = AssetIsarRepository(db: db);
  final sp = Stopwatch()..start();
  for (final chunk in assets) {
    await repo.upsertAll(chunk);
  }
  print('$name - ${sp.elapsed}');
}

Future<void> _benchDriftInsertsNonBatched({
  required String name,
  required List<Asset> assets,
  required DriftDatabaseRepository db,
}) async {
  final repo = AssetRepository(db: db);
  final sp = Stopwatch()..start();
  for (final chunk in assets) {
    await repo.upsert(chunk);
  }
  print('$name - ${sp.elapsed}');
}

Future<void> _benchIsarInsertsNonBatched({
  required String name,
  required List<Asset> assets,
  required Isar db,
}) async {
  final repo = AssetIsarRepository(db: db);
  final sp = Stopwatch()..start();
  for (final chunk in assets) {
    await repo.upsert(chunk);
  }
  print('$name - ${sp.elapsed}');
}

Future<void> _cleanup(File file) async {
  if (await file.exists()) {
    await file.delete();
  }
}

void main() {
  late DriftDatabaseRepository drift;
  late Isar isar;

  // ignore: avoid-local-functions
  Future<void> setup() async {
    drift = DriftDatabaseRepository(LazyDatabase(() {
      sqlite3.tempDirectory = 'test/';
      return NativeDatabase.createInBackground(File('test/test.sqlite'));
    }));
    isar = await TestUtils.initIsar();
  }

  // ignore: avoid-local-functions
  Future<void> cleanupFiles() async {
    await _cleanup(File('test/test.sqlite'));
    await _cleanup(File('test/test.sqlite-shm'));
    await _cleanup(File('test/test.sqlite-wal'));
    await _cleanup(File('test/default.isar'));
  }

  // ignore: avoid-local-functions
  Future<void> closeDb() async {
    await drift.close();
    if (isar.isOpen) {
      await isar.close();
    }
  }

  test('10K assets', () async {
    await cleanupFiles();
    await setup();

    final assets = _generateAssets(10000);
    await _benchDriftInsertsBatched(
      name: 'Drift 10K assets batched - 1K slice',
      assets: assets.slices(1000),
      db: drift,
    );
    await _benchIsarInsertsBatched(
      name: 'Isar 10K assets batched - 1K slice',
      assets: assets.slices(1000),
      db: isar,
    );

    await closeDb();
    await cleanupFiles();
    await setup();

    await _benchDriftInsertsNonBatched(
      name: 'Drift 10K assets non-batched',
      assets: assets,
      db: drift,
    );
    await _benchIsarInsertsNonBatched(
      name: 'Isar 10K assets non-batched',
      assets: assets,
      db: isar,
    );
  });

  test(
    '100K assets',
    () async {
      await cleanupFiles();
      await setup();

      final assets = _generateAssets(100000);
      await _benchDriftInsertsBatched(
        name: 'Drift 100K assets batched - 10K slice',
        assets: assets.slices(10000),
        db: drift,
      );
      await _benchIsarInsertsBatched(
        name: 'Isar 100K assets batched - 10K slice',
        assets: assets.slices(10000),
        db: isar,
      );

      await closeDb();
      await cleanupFiles();
      await setup();

      await _benchDriftInsertsNonBatched(
        name: 'Drift 100K assets non-batched',
        assets: assets,
        db: drift,
      );
      await _benchIsarInsertsNonBatched(
        name: 'Isar 100K assets non-batched',
        assets: assets,
        db: isar,
      );
    },
    timeout: Timeout(Duration(minutes: 5)),
  );

  test(
    '1M assets',
    () async {
      await cleanupFiles();
      await setup();

      final assets = _generateAssets(1000000);
      await _benchDriftInsertsBatched(
        name: 'Drift 1M assets batched - 10K slice',
        assets: assets.slices(10000),
        db: drift,
      );
      await _benchIsarInsertsBatched(
        name: 'Isar 1M assets batched - 10K slice',
        assets: assets.slices(10000),
        db: isar,
      );

      await closeDb();
      await cleanupFiles();
      await setup();

      await _benchDriftInsertsNonBatched(
        name: 'Drift 1M assets non-batched',
        assets: assets,
        db: drift,
      );
      await _benchIsarInsertsNonBatched(
        name: 'Isar 1M assets non-batched',
        assets: assets,
        db: isar,
      );
    },
    timeout: Timeout(Duration(minutes: 25)),
  );
}
