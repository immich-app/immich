import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';

final currentAssetNotifier =
    AutoDisposeNotifierProvider<CurrentAssetNotifier, BaseAsset?>(
  CurrentAssetNotifier.new,
);

class CurrentAssetNotifier extends AutoDisposeNotifier<BaseAsset?> {
  KeepAliveLink? _keepAliveLink;
  StreamSubscription<BaseAsset?>? _assetSubscription;

  @override
  BaseAsset? build() => null;

  void setAsset(BaseAsset asset) {
    _keepAliveLink?.close();
    _assetSubscription?.cancel();
    state = asset;
    _assetSubscription = ref
        .watch(assetServiceProvider)
        .watchAsset(asset)
        .listen((updatedAsset) {
      if (updatedAsset != null) {
        state = updatedAsset;
      }
    });
    _keepAliveLink = ref.keepAlive();
  }

  void dispose() {
    _keepAliveLink?.close();
    _assetSubscription?.cancel();
  }
}

final currentAssetExifProvider = FutureProvider.autoDispose(
  (ref) {
    final currentAsset = ref.watch(currentAssetNotifier);
    if (currentAsset == null) {
      return null;
    }
    return ref.watch(assetServiceProvider).getExif(currentAsset);
  },
);
