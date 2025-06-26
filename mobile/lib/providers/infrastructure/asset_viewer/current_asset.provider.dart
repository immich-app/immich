import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

final currentAssetNotifier =
    NotifierProvider<CurrentAssetNotifier, BaseAsset>(CurrentAssetNotifier.new);

class CurrentAssetNotifier extends Notifier<BaseAsset> {
  @override
  BaseAsset build() {
    throw UnimplementedError(
      'An asset must be set before using the currentAssetProvider.',
    );
  }

  void setAsset(BaseAsset asset) {
    state = asset;
  }
}

final currentAssetExifProvider = FutureProvider(
  (ref) {
    final currentAsset = ref.watch(currentAssetNotifier);
    return ref.watch(assetServiceProvider).getExif(currentAsset);
  },
);
