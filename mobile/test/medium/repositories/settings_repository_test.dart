import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late SettingsRepository sut;

  setUpAll(() async {
    ctx = MediumRepositoryContext();
    sut = await SettingsRepository.ensureInitialized(ctx.db);
  });

  tearDownAll(() async {
    await ctx.dispose();
  });

  setUp(() async {
    await ctx.db.delete(ctx.db.settingsEntity).go();
    await SettingsRepository.instance.refresh();
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

      final rows = await ctx.db.select(ctx.db.settingsEntity).get();
      expect(rows, isEmpty);
    });
  });

  group('null values', () {
    test('writing null to a nullable key clears the row and reverts the cache to null', () async {
      await sut.write(SettingsKey.networkPreferredWifiName, 'home-wifi');
      expect(sut.appConfig.network.preferredWifiName, 'home-wifi');
      expect(await ctx.db.select(ctx.db.settingsEntity).get(), hasLength(1));

      await sut.write(SettingsKey.networkPreferredWifiName, null);

      expect(await ctx.db.select(ctx.db.settingsEntity).get(), isEmpty);
      expect(sut.appConfig.network.preferredWifiName, isNull);
    });

    test('writing null to an already-null key is a no-op', () async {
      await sut.write(SettingsKey.networkPreferredWifiName, null);
      expect(await ctx.db.select(ctx.db.settingsEntity).get(), isEmpty);
    });

    test('a stored NULL value column decodes to null on refresh', () async {
      await ctx.db
          .into(ctx.db.settingsEntity)
          .insert(
            SettingsEntityCompanion.insert(
              key: SettingsKey.networkPreferredWifiName.name,
              value: const .new(null),
              updatedAt: .new(DateTime.now()),
            ),
          );

      await SettingsRepository.instance.refresh();
      expect(sut.appConfig.network.preferredWifiName, isNull);
    });
  });

  group('delete', () {});

  group('sync', () {
    test('picks up rows that were inserted directly into the DB', () async {
      await ctx.db
          .into(ctx.db.settingsEntity)
          .insert(
            SettingsEntityCompanion.insert(
              key: SettingsKey.themeMode.name,
              value: .new(ThemeMode.dark.name),
              updatedAt: .new(DateTime.now()),
            ),
          );

      // Cache hasn't seen this row yet — view still returns the default.
      expect(sut.appConfig.theme.mode, ThemeMode.system);

      await SettingsRepository.instance.refresh();
      expect(sut.appConfig.theme.mode, ThemeMode.dark);
    });

    test('drops cached values for rows that were deleted out from under the repo', () async {
      await sut.write(.themeMode, ThemeMode.dark);
      // Wipe the row directly. Cache still holds the old value.
      await ctx.db.delete(ctx.db.settingsEntity).go();
      expect(sut.appConfig.theme.mode, ThemeMode.dark);

      await SettingsRepository.instance.refresh();
      expect(sut.appConfig.theme.mode, ThemeMode.system);
    });

    test('skips rows whose key is unknown to SettingsKey', () async {
      await ctx.db
          .into(ctx.db.settingsEntity)
          .insert(
            SettingsEntityCompanion.insert(
              key: 'app-config.unknown.future-key',
              value: const .new('unknown'),
              updatedAt: .new(DateTime.now()),
            ),
          );

      await SettingsRepository.instance.refresh();
      expect(sut.appConfig.theme.mode, ThemeMode.system);
    });
  });

  group('watch', () {
    test('watchAppConfig emits the new value after a write', () async {
      final expectation = expectLater(sut.watchConfig().map((c) => c.theme.mode), emitsThrough(ThemeMode.dark));
      await sut.write(SettingsKey.themeMode, ThemeMode.dark);
      await expectation;
    });

    test('watchConfig emits the new value after a write', () async {
      final expectation = expectLater(sut.watchConfig().map((c) => c.logLevel), emitsThrough(LogLevel.warning));
      await sut.write(SettingsKey.logLevel, LogLevel.warning);
      await expectation;
    });
  });
}
