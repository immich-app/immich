import 'dart:io';

// ignore: import_rule_drift
import 'package:benchmarking/benchmarking.dart';
// ignore: import_rule_drift
import 'package:drift/drift.dart';
// ignore: import_rule_drift
import 'package:drift/native.dart';
import 'package:faker/faker.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/renderlist.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/repositories/asset.repository.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/repositories/renderlist.repository.dart';
import 'package:sqlite3/sqlite3.dart';

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
      createdTime: faker.date.dateTime(minYear: 2010, maxYear: 2024),
      modifiedTime: faker.date.dateTime(minYear: 2010, maxYear: 2024),
      duration: faker.randomGenerator.integer(100),
      localId: faker.guid.guid(),
      remoteId: faker.guid.guid(),
      livePhotoVideoId: faker.guid.guid(),
    ));
  }
  return assets;
}

Future<void> _driftInserts({
  required List<Asset> assets,
  required DriftDatabaseRepository db,
}) async {
  final repo = AssetRepository(db: db);
  await repo.upsertAll(assets);
}

void main() {
  late DriftDatabaseRepository drift;
  late File file;

  setUp(() {
    file = File('test/test.sqlite');
    drift = DriftDatabaseRepository(LazyDatabase(() {
      sqlite3.tempDirectory = 'test/';
      return NativeDatabase.createInBackground(file);
    }));
  });

  tearDown(() async {
    for (final table in drift.allTables) {
      await drift.delete(table).go();
    }
    await drift.close();
  });

  group('Generate RenderList', () {
    test('10K assets', () async {
      List<Asset> assets = [];
      final IRenderListRepository repo = RenderListRepository(db: drift);
      final result = await asyncBenchmark(
        'Generate RenderList for 10K assets',
        () async {
          await repo.getAll();
        },
        setup: () async {
          assets = _generateAssets(10000);
          await _driftInserts(assets: assets, db: drift);
        },
      );
      result.report(units: 10000);
    });
    test('Drift 100K assets', () async {
      List<Asset> assets = [];
      await _driftInserts(assets: assets, db: drift);
      final IRenderListRepository repo = RenderListRepository(db: drift);
      final result = await asyncBenchmark(
        'Generate RenderList for 100K assets',
        () async {
          await repo.getAll();
        },
        setup: () async {
          assets = _generateAssets(100000);
          await _driftInserts(assets: assets, db: drift);
        },
      );
      result.report(units: 100000);
    });
    test(
      'Drift 1M assets',
      () async {
        List<Asset> assets = [];
        final IRenderListRepository repo = RenderListRepository(db: drift);
        final result = await asyncBenchmark(
          'Generate RenderList for 1M assets',
          () async {
            await repo.getAll();
          },
          setup: () async {
            assets = _generateAssets(1000000);
            await _driftInserts(assets: assets, db: drift);
          },
        );
        result.report(units: 1000000);
      },
      timeout: Timeout(Duration(minutes: 2)),
    );
  });
}
