import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

import '../../unit/factories/remote_asset_factory.dart';

void main() {
  group('MultiSelectNotifier', () {
    test('matches equivalent remote assets even when their hash differs', () {
      final asset = RemoteAssetFactory.create(id: 'asset', ownerId: 'owner');
      final timelineAsset = asset.copyWith(localId: 'local-copy');

      expect(asset, timelineAsset);
      expect({asset}.contains(timelineAsset), isFalse);
      expect(MultiSelectNotifier.containsAsset({asset}, timelineAsset), isTrue);
    });

    test('does not add duplicate equivalent assets', () {
      final asset = RemoteAssetFactory.create(id: 'asset', ownerId: 'owner');
      final timelineAsset = asset.copyWith(localId: 'local-copy');

      final selected = MultiSelectNotifier.addAssets({asset}, [timelineAsset]);

      expect(selected.length, 1);
      expect(MultiSelectNotifier.containsAsset(selected, timelineAsset), isTrue);
    });

    test('removes equivalent assets even when their hash differs', () {
      final asset = RemoteAssetFactory.create(id: 'asset', ownerId: 'owner');
      final timelineAsset = asset.copyWith(localId: 'local-copy');

      final selected = MultiSelectNotifier.removeAssets({asset}, [timelineAsset]);

      expect(selected, isEmpty);
    });
  });
}
