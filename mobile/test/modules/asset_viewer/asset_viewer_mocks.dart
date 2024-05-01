import 'package:immich_mobile/modules/asset_viewer/providers/current_asset.provider.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:mocktail/mocktail.dart';

class MockCurrentAssetProvider extends CurrentAssetInternal
    with Mock
    implements CurrentAsset {
  Asset? initAsset;
  MockCurrentAssetProvider([this.initAsset]);

  @override
  Asset? build() {
    return initAsset;
  }
}
