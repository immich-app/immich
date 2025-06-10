import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

abstract interface class ILocalAssetRepository implements IDatabaseRepository {
  Future<void> updateHashes(Iterable<LocalAsset> hashes);
}
