import 'package:flutter/painting.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';

import '../../../unit/factories/local_asset_factory.dart';

class _StubCompleter extends ImageStreamCompleter {}

void main() {
  late ImageCache cache;
  late int loads;

  ImageStreamCompleter load() {
    loads++;
    return _StubCompleter();
  }

  setUp(() {
    cache = ImageCache();
    loads = 0;
  });

  group('LocalThumbProvider caching', () {
    test('editing on device re-renders the thumbnail', () {
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image, checksum: 'before'), load);
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image, checksum: 'after'), load);

      expect(loads, 2);
    });

    test('an unchanged thumbnail still comes from the cache', () {
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image, checksum: 'same'), load);
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image, checksum: 'same'), load);

      expect(loads, 1);
    });

    // The rehash clears the checksum before writing the new one, so the tile has to
    // follow that step too or it waits for the hash to land before showing the edit.
    test('re-renders while the checksum is still being recomputed', () {
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image, checksum: 'before'), load);
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image), load);

      expect(loads, 2);
    });

    test('stays cached while the checksum is missing', () {
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image), load);
      cache.putIfAbsent(LocalThumbProvider(id: 'asset-1', assetType: AssetType.image), load);

      expect(loads, 1);
    });
  });

  group('factories', () {
    test('thumbnails are keyed by the asset checksum', () {
      final asset = LocalAssetFactory.create().copyWith(checksum: 'abc');

      final provider = getThumbnailImageProvider(asset) as LocalThumbProvider;

      expect(provider.checksum, 'abc');
    });
  });

  group('LocalFullImageProvider caching', () {
    test('editing on device re-renders the full image', () {
      cache.putIfAbsent(
        LocalFullImageProvider(
          id: 'asset-1',
          assetType: AssetType.image,
          size: const Size(100, 100),
          isAnimated: false,
          checksum: 'before',
        ),
        load,
      );
      cache.putIfAbsent(
        LocalFullImageProvider(
          id: 'asset-1',
          assetType: AssetType.image,
          size: const Size(100, 100),
          isAnimated: false,
          checksum: 'after',
        ),
        load,
      );

      expect(loads, 2);
    });
  });
}
