import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/services/dynamic_wallpaper.service.dart';

import '../unit/factories/local_asset_factory.dart';
import '../unit/factories/remote_asset_factory.dart';

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

    test('removes selected ids while preserving the remaining order', () {
      final ids = DynamicWallpaperService.removeAssetIds(['a', 'b', 'c', 'd'], ['b', 'd']);

      expect(ids, ['a', 'c']);
    });

    test('reorders selected ids using ReorderableListView indexes', () {
      final ids = DynamicWallpaperService.reorderAssetIds(['a', 'b', 'c', 'd'], 1, 4);

      expect(ids, ['a', 'c', 'd', 'b']);
    });
  });
}
