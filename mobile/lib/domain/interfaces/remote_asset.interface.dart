import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

abstract interface class IRemoteAssetRepository {
  Future<Asset> getAsset(String id);
}
