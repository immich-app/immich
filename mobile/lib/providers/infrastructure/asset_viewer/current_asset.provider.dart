import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

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
