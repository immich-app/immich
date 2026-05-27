import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/infrastructure/entities/metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late MetadataRepository sut;

  setUpAll(() async {
    ctx = MediumRepositoryContext();
    sut = await MetadataRepository.ensureInitialized(ctx.db);
  });

  tearDownAll(() async {
    await ctx.dispose();
  });

  setUp(() async {
    await ctx.db.delete(ctx.db.metadataEntity).go();
    await MetadataRepository.instance.refresh();
  });

  group('defaults', () {
    test('appConfig returns key defaults when DB is empty', () {
      expect(sut.appConfig.theme.mode, ThemeMode.system);
    });

    test('appConfig returns key defaults when DB is empty', () {
      expect(sut.appConfig.logLevel, LogLevel.info);
    });
  });

  group('write', () {
    test('persists a value and reflects it in the composed view', () async {
      await sut.write(.themeMode, ThemeMode.dark);
      expect(sut.appConfig.theme.mode, ThemeMode.dark);
    });

    test('persists across domains independently', () async {
      await sut.write(.themeMode, ThemeMode.light);
      await sut.write(.logLevel, LogLevel.severe);
      expect(sut.appConfig.theme.mode, ThemeMode.light);
      expect(sut.appConfig.logLevel, LogLevel.severe);
    });

    test('removes the row and reverts to default', () async {
      await sut.write(.themeMode, ThemeMode.dark);
      expect(sut.appConfig.theme.mode, ThemeMode.dark);

      await sut.write(.themeMode, ThemeMode.system);
      expect(sut.appConfig.theme.mode, ThemeMode.system);

      final rows = await ctx.db.select(ctx.db.metadataEntity).get();
      expect(rows, isEmpty);
    });
  });

  group('delete', () {});

  group('sync', () {
    test('picks up rows that were inserted directly into the DB', () async {
      await ctx.db
          .into(ctx.db.metadataEntity)
          .insert(
            MetadataEntityCompanion.insert(
              key: MetadataKey.themeMode.name,
              value: ThemeMode.dark.name,
              updatedAt: Value(DateTime.now()),
            ),
          );

      // Cache hasn't seen this row yet — view still returns the default.
      expect(sut.appConfig.theme.mode, ThemeMode.system);

      await MetadataRepository.instance.refresh();
      expect(sut.appConfig.theme.mode, ThemeMode.dark);
    });

    test('drops cached values for rows that were deleted out from under the repo', () async {
      await sut.write(.themeMode, ThemeMode.dark);
      // Wipe the row directly. Cache still holds the old value.
      await ctx.db.delete(ctx.db.metadataEntity).go();
      expect(sut.appConfig.theme.mode, ThemeMode.dark);

      await MetadataRepository.instance.refresh();
      expect(sut.appConfig.theme.mode, ThemeMode.system);
    });

    test('skips rows whose key is unknown to MetadataKey', () async {
      await ctx.db
          .into(ctx.db.metadataEntity)
          .insert(
            MetadataEntityCompanion.insert(
              key: 'app-config.unknown.future-key',
              value: 'whatever',
              updatedAt: Value(DateTime.now()),
            ),
          );

      await MetadataRepository.instance.refresh();
      expect(sut.appConfig.theme.mode, ThemeMode.system);
    });
  });

  group('watch', () {
    test('watchAppConfig emits the new value after a write', () async {
      final expectation = expectLater(sut.watchConfig().map((c) => c.theme.mode), emitsThrough(ThemeMode.dark));
      await sut.write(MetadataKey.themeMode, ThemeMode.dark);
      await expectation;
    });

    test('watchConfig emits the new value after a write', () async {
      final expectation = expectLater(sut.watchConfig().map((c) => c.logLevel), emitsThrough(LogLevel.warning));
      await sut.write(MetadataKey.logLevel, LogLevel.warning);
      await expectation;
    });
  });
}
