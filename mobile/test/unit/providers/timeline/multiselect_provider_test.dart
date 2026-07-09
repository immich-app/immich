import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

import '../../factories/local_asset_factory.dart';
import '../../factories/remote_asset_factory.dart';

void main() {
  group('MultiSelectNotifier', () {
    test('selectAsset skips assets that refer to same remote asset', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(multiSelectProvider.notifier);
      final asset = RemoteAssetFactory.create(id: 'asset-1');
      final mergedCopy = asset.copyWith(localId: 'local-1');

      notifier.selectAsset(asset);
      notifier.selectAsset(mergedCopy);

      expect(container.read(multiSelectProvider).selectedAssets, {asset});
    });

    test('deselectAsset removes assets that refer to same local asset', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(multiSelectProvider.notifier);
      final asset = LocalAssetFactory.create(id: 'local-1');
      final mergedCopy = asset.copyWith(remoteId: 'asset-1');

      notifier.selectAsset(asset);
      notifier.deselectAsset(mergedCopy);

      expect(container.read(multiSelectProvider).selectedAssets, isEmpty);
    });
  });

  group('bucketSelectionProvider', () {
    test('matches selected assets by identity semantics, not Set hash bucket', () {
      final selected = RemoteAssetFactory.create(id: 'asset-1');
      final visible = selected.copyWith(localId: 'local-1');
      final container = ProviderContainer(
        overrides: [
          multiSelectProvider.overrideWith(
            () => MultiSelectNotifier(MultiSelectState(selectedAssets: {selected}, lockedSelectionAssets: const {})),
          ),
        ],
      );
      addTearDown(container.dispose);

      expect(container.read(bucketSelectionProvider([visible])), isTrue);
    });
  });
}
