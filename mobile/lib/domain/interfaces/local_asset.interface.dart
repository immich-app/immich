import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';

abstract interface class ILocalAssetRepository implements IDatabaseRepository {
  Future<LocalAsset> get(String assetId);

  Future<void> upsertAll(Iterable<LocalAsset> localAssets);

  Future<void> deleteIds(Iterable<String> ids);
}
