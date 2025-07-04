import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

final currentAssetNotifier =
    AutoDisposeNotifierProvider<CurrentAssetNotifier, BaseAsset>(
  CurrentAssetNotifier.new,
);

class CurrentAssetNotifier extends AutoDisposeNotifier<BaseAsset> {
  KeepAliveLink? _keepAliveLink;

  @override
  BaseAsset build() {
    throw UnimplementedError(
      'An asset must be set before using the currentAssetProvider.',
    );
  }

  void setAsset(BaseAsset asset) {
    _keepAliveLink?.close();
    state = asset;
    _keepAliveLink = ref.keepAlive();
  }

  void dispose() {
    _keepAliveLink?.close();
  }
}

final currentAssetExifProvider = FutureProvider.autoDispose(
  (ref) {
    final currentAsset = ref.watch(currentAssetNotifier);
    return ref.watch(assetServiceProvider).getExif(currentAsset);
  },
);
