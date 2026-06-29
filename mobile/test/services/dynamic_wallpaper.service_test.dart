import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/dynamic_wallpaper_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/platform/dynamic_wallpaper_api.g.dart';
import 'package:immich_mobile/services/dynamic_wallpaper.service.dart';
import 'package:mocktail/mocktail.dart';

import '../unit/factories/local_asset_factory.dart';
import '../unit/factories/remote_asset_factory.dart';

class _MockSettingsRepository extends Mock implements SettingsRepository {}

class _MockDynamicWallpaperApi extends Mock implements DynamicWallpaperApi {}

class _MockAssetService extends Mock implements AssetService {}

void main() {
  group('DynamicWallpaperService', () {
    test('keeps only remote image ids from selected assets', () {
      final remoteImage = RemoteAssetFactory.create(id: 'remote-image');
      final mergedImage = RemoteAssetFactory.create(id: 'merged-image').copyWith(localId: 'local-copy');
      final remoteVideo = RemoteAssetFactory.create(id: 'remote-video').copyWith(type: AssetType.video);
      final localImage = LocalAssetFactory.create(id: 'local-image');

      final ids = DynamicWallpaperService.remoteImageIdsFrom([
        remoteImage,
        mergedImage,
        remoteVideo,
        localImage,
        remoteImage,
        mergedImage,
      ]);

      expect(ids, [remoteImage.id, mergedImage.id]);
    });

    test('adds only missing ids without replacing the current list', () {
      final update = DynamicWallpaperService.addMissingAssetIds(['a', 'b', 'c'], ['b', 'd']);

      expect(update.assetIds, ['a', 'b', 'c', 'd']);
      expect(update.addedCount, 1);
      expect(update.skippedCount, 1);
    });

    test('deduplicates selected ids before counting additions', () {
      final update = DynamicWallpaperService.addMissingAssetIds(['a'], ['a', 'b', 'b']);

      expect(update.assetIds, ['a', 'b']);
      expect(update.addedCount, 1);
      expect(update.skippedCount, 1);
    });

    test('deduplicates selected ids while preserving selection order', () {
      final update = DynamicWallpaperService.addMissingAssetIds(['a', 'b'], ['d', 'b', 'c', 'd']);

      expect(update.assetIds, ['a', 'b', 'd', 'c']);
      expect(update.addedCount, 2);
      expect(update.skippedCount, 1);
    });

    test('removes selected ids while preserving the remaining order', () {
      final ids = DynamicWallpaperService.removeAssetIds(['a', 'b', 'c', 'd'], ['b', 'd']);

      expect(ids, ['a', 'c']);
    });

    test('replaces selection while preserving existing order and appending new ids', () {
      final ids = DynamicWallpaperService.replaceAssetIdsFromSelection(
        currentAssetIds: ['a', 'b', 'c'],
        selectedAssetIds: ['c', 'a', 'd'],
      );

      expect(ids, ['a', 'c', 'd']);
    });

    test('preserves unresolved ids while replacing the timeline selection', () {
      final ids = DynamicWallpaperService.replaceAssetIdsFromSelection(
        currentAssetIds: ['a', 'b', 'c'],
        selectedAssetIds: ['a'],
        preservedAssetIds: ['b'],
      );

      expect(ids, ['a', 'b']);
    });

    test('reorders selected ids using ReorderableListView indexes', () {
      final ids = DynamicWallpaperService.reorderAssetIds(['a', 'b', 'c', 'd'], 1, 4);

      expect(ids, ['a', 'c', 'd', 'b']);
    });

    test('does not persist settings when Android configure fails', () async {
      final settings = _MockSettingsRepository();
      final api = _MockDynamicWallpaperApi();
      final service = DynamicWallpaperService(settings, api, isAndroid: true);

      when(
        () => settings.appConfig,
      ).thenReturn(const AppConfig(dynamicWallpaper: DynamicWallpaperConfig(assetIds: ['old'])));
      when(() => api.configure(any())).thenAnswer((_) => Future.error(Exception('native failed')));
      when(
        () => settings.write<List<String>, List<String>>(SettingsKey.dynamicWallpaperAssetIds, any()),
      ).thenAnswer((_) async {});

      await expectLater(service.configure(assetIds: ['new']), throwsException);

      verifyNever(() => settings.write<List<String>, List<String>>(SettingsKey.dynamicWallpaperAssetIds, any()));
    });

    test('persists settings after Android configure succeeds', () async {
      final settings = _MockSettingsRepository();
      final api = _MockDynamicWallpaperApi();
      final assetService = _MockAssetService();
      final service = DynamicWallpaperService(settings, api, assetService: assetService, isAndroid: true);
      final calls = <String>[];
      final assetA = RemoteAssetFactory.create(id: 'a').copyWith(localId: 'local-a');
      final assetB = RemoteAssetFactory.create(id: 'b').copyWith(isEdited: true);

      when(() => settings.appConfig).thenReturn(const AppConfig());
      when(() => assetService.getRemoteAssets(['a', 'b'])).thenAnswer((_) async => [assetA, assetB]);
      when(() => api.configure(any())).thenAnswer((_) async {
        calls.add('native');
      });
      when(() => settings.write<List<String>, List<String>>(SettingsKey.dynamicWallpaperAssetIds, any())).thenAnswer((
        _,
      ) async {
        calls.add('settings');
      });

      await service.configure(assetIds: ['a', 'b', 'a']);

      verify(
        () => api.configure([
          DynamicWallpaperAssetRef(remoteId: 'a', localId: 'local-a', isEdited: false),
          DynamicWallpaperAssetRef(remoteId: 'b', isEdited: true),
        ]),
      ).called(1);
      verify(
        () => settings.write<List<String>, List<String>>(SettingsKey.dynamicWallpaperAssetIds, ['a', 'b']),
      ).called(1);
      expect(calls, ['native', 'settings']);
    });

    test('refresh passes resolved refs without writing settings', () async {
      final settings = _MockSettingsRepository();
      final api = _MockDynamicWallpaperApi();
      final assetService = _MockAssetService();
      final service = DynamicWallpaperService(settings, api, assetService: assetService, isAndroid: true);
      final assetA = RemoteAssetFactory.create(id: 'a').copyWith(localId: 'local-a');

      when(
        () => settings.appConfig,
      ).thenReturn(const AppConfig(dynamicWallpaper: DynamicWallpaperConfig(assetIds: ['a'])));
      when(() => assetService.getRemoteAssets(['a'])).thenAnswer((_) async => [assetA]);
      when(() => api.refresh(any())).thenAnswer((_) async {});

      await service.refreshPreparedWallpapers();

      verify(
        () => api.refresh([DynamicWallpaperAssetRef(remoteId: 'a', localId: 'local-a', isEdited: false)]),
      ).called(1);
      verifyNever(() => settings.write<List<String>, List<String>>(SettingsKey.dynamicWallpaperAssetIds, any()));
    });

    test('replaceSelection keeps only remote images and preserves unresolved ids', () async {
      final settings = _MockSettingsRepository();
      final api = _MockDynamicWallpaperApi();
      final service = DynamicWallpaperService(settings, api, isAndroid: false);
      final remoteA = RemoteAssetFactory.create(id: 'a');
      final remoteC = RemoteAssetFactory.create(id: 'c');
      final remoteVideo = RemoteAssetFactory.create(id: 'video').copyWith(type: AssetType.video);
      final localImage = LocalAssetFactory.create(id: 'local');

      when(
        () => settings.appConfig,
      ).thenReturn(const AppConfig(dynamicWallpaper: DynamicWallpaperConfig(assetIds: ['a', 'b'])));
      when(
        () => settings.write<List<String>, List<String>>(SettingsKey.dynamicWallpaperAssetIds, any()),
      ).thenAnswer((_) async {});

      final ids = await service.replaceSelection([remoteC, remoteA, remoteVideo, localImage], preservedAssetIds: ['b']);

      expect(ids, ['a', 'b', 'c']);
      verify(
        () => settings.write<List<String>, List<String>>(SettingsKey.dynamicWallpaperAssetIds, ['a', 'b', 'c']),
      ).called(1);
      verifyNever(() => api.configure(any()));
    });
  });
}
