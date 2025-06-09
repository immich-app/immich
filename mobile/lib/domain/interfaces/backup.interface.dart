import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class IBackupRepository implements IDatabaseRepository {
  Future<List<LocalAsset>> getAssets(String albumId);

  Future<List<String>> getAssetIds(String albumId);

  /// Returns the total number of assets that are selected for backup.
  Future<int> getTotalCount(BackupSelection selection);

  Future<int> getBackupCount();
}
