import 'package:immich_mobile/modules/asset_viewer/providers/current_asset.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:mocktail/mocktail.dart';

class MockCurrentAssetProvider extends CurrentAssetInternal
    with Mock
    implements CurrentAsset {
  @override
  set state(Asset? asset) => super.state = asset;
}
