import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/app_metadata_key.dart';
import 'package:immich_mobile/infrastructure/entities/app_metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/app_metadata.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late AppMetadataRepository sut;

  setUpAll(() {
    ctx = MediumRepositoryContext();
    sut = AppMetadataRepository(ctx.db);
  });

  tearDownAll(() async {
    await ctx.dispose();
  });

  setUp(() async {
    await ctx.db.delete(ctx.db.appMetadataEntity).go();
  });

  group('get', () {
    test('a stored NULL value column resolves to the key default', () async {
      await ctx.db
          .into(ctx.db.appMetadataEntity)
          .insert(
            AppMetadataEntityCompanion.insert(
              key: AppMetadataKey.manageLocalMediaAndroid.name,
              value: const .new(null),
              updatedAt: .new(DateTime.now()),
            ),
          );

      expect(await sut.get(.manageLocalMediaAndroid), false);
    });
  });

  group('defaults', () {
    test('falls back to the key default when the value is absent', () async {
      expect(await sut.get(.version), kCurrentVersion);
      expect(await sut.get(.syncMigrationStatus), const <String>[]);
      expect(await sut.get(.manageLocalMediaAndroid), false);
    });

    test('a stored value takes precedence over the default', () async {
      await sut.set(.version, 5);
      await sut.set(.syncMigrationStatus, const ['task']);
      await sut.set(.manageLocalMediaAndroid, true);

      expect(await sut.get(.version), 5);
      expect(await sut.get(.syncMigrationStatus), const ['task']);
      expect(await sut.get(.manageLocalMediaAndroid), true);
    });
  });

  group('set', () {
    test('round-trips int, List and bool values to their typed form', () async {
      await sut.set(.version, 42);
      await sut.set(.syncMigrationStatus, const ['task']);
      await sut.set(.manageLocalMediaAndroid, true);

      expect(await sut.get(.version), 42);
      expect(await sut.get(.syncMigrationStatus), const ['task']);
      expect(await sut.get(.manageLocalMediaAndroid), true);
    });

    test('overwrites the existing value and keeps a single row per key', () async {
      await sut.set(.version, 1);
      await sut.set(.version, 2);

      expect(await sut.get(.version), 2);
      expect(await ctx.db.select(ctx.db.appMetadataEntity).get(), hasLength(1));
    });
  });

  group('cache-less reads', () {
    test('observes a value mutated directly in the DB', () async {
      await sut.set(.version, 10);

      await (ctx.db.update(ctx.db.appMetadataEntity)..where((r) => r.key.equals(AppMetadataKey.version.name))).write(
        AppMetadataEntityCompanion(value: .new(AppMetadataKey.version.encode(99))),
      );

      expect(await sut.get(.version), 99);
    });
  });
}
