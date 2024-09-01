import 'package:immich_mobile/domain/models/asset/remote_asset.model.dart';

abstract class IRemoteAssetRepository {
  /// Batch insert asset
  Future<bool> addAll(Iterable<RemoteAsset> assets);
}
