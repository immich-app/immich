import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:intl/date_symbol_data_local.dart';

import '../../drift/main/generated/schema.dart';
import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;

  setUpAll(initializeDateFormatting);

  setUp(() {
    ctx = MediumRepositoryContext();
  });

  tearDown(() async {
    await ctx.dispose();
  });

  Future<DateTime> storedCreatedAt(DateTime createdAt) async {
    final asset = await ctx.newLocalAsset(createdAt: createdAt);
    final row = await (ctx.db.select(ctx.db.localAssetEntity)..where((t) => t.id.equals(asset.id))).getSingle();
    return row.createdAt;
  }

  test('clamps a date before year 1 to the floor', () async {
    expect(await storedCreatedAt(DateTime.utc(-4712, 3, 4)), DateTime.utc(1));
  });

  test('clamps a date after year 9999 to the ceiling', () async {
    // the reporter's date from #28524
    expect(await storedCreatedAt(DateTime.utc(144769, 11, 18, 12, 38, 32)), DateTime.utc(9999, 12, 31));
  });

  test('stores a late hour on the last day at the midnight ceiling', () async {
    expect(await storedCreatedAt(DateTime.utc(9999, 12, 31, 23, 59, 59)), DateTime.utc(9999, 12, 31));
  });

  test('stores a date in range unchanged', () async {
    final date = DateTime.utc(2024, 1, 2, 3, 4, 5, 123);
    expect(await storedCreatedAt(date), date);
  });

  test('v34 clamps dates already stored out of range', () async {
    final verifier = SchemaVerifier(GeneratedHelper());
    final schema = await verifier.schemaAt(33);
    schema.rawDatabase.execute(
      "INSERT INTO local_asset_entity (id, name, type, created_at, updated_at) "
      "VALUES ('a', 'a.jpg', 0, '+144769-11-18T12:38:32.000Z', '-4712-03-04T05:06:07.000Z')",
    );
    final db = Drift(schema.newConnection());
    addTearDown(db.close);
    await verifier.migrateAndValidate(db, 34);

    final row = await (db.select(db.localAssetEntity)..where((t) => t.id.equals('a'))).getSingle();
    expect(row.createdAt, DateTime.utc(9999, 12, 31));
    expect(row.updatedAt, DateTime.utc(1));
  });

  test('timeline buckets a clamped date instead of crashing', () async {
    final user = await ctx.newUser();
    await ctx.newRemoteAsset(ownerId: user.id, createdAt: DateTime.utc(144769, 11, 18, 12, 38, 32));

    final buckets = await TimelineRepository(ctx.db).main([user.id], .day).bucketSource().first;
    expect(buckets, [TimeBucket(date: DateTime(9999, 12, 31), assetCount: 1)]);
  });
}
