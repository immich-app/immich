import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class IBackupRepository implements IDatabaseRepository {
  Future<List<LocalAsset>> getAssets(String albumId);

  Future<List<String>> getAssetIds(String albumId);

  Future<int> getTotalCount();
  Future<int> getRemainderCount();
  Future<int> getBackupCount();

  Future<List<LocalAlbum>> getBackupAlbums(BackupSelection selectionType);
  Future<List<LocalAsset>> getCandidates();
}
