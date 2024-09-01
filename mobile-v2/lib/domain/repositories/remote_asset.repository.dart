import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/remote_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/remote_asset.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

class RemoteAssetDriftRepository
    with LogContext
    implements IRemoteAssetRepository {
  final DriftDatabaseRepository _db;

  const RemoteAssetDriftRepository(this._db);

  @override
  Future<bool> addAll(Iterable<RemoteAsset> assets) async {
    try {
      await _db.batch((batch) => batch.insertAllOnConflictUpdate(
            _db.remoteAsset,
            assets.map(_toEntity),
          ));

      return true;
    } catch (e, s) {
      log.severe("Cannot insert remote assets into table", e, s);
      return false;
    }
  }
}

RemoteAssetCompanion _toEntity(RemoteAsset asset) {
  return RemoteAssetCompanion.insert(
    name: asset.name,
    checksum: asset.checksum,
    height: Value(asset.height),
    width: Value(asset.width),
    type: asset.type,
    createdTime: asset.createdTime,
    remoteId: asset.remoteId,
    duration: Value(asset.duration),
    modifiedTime: Value(asset.modifiedTime),
    livePhotoVideoId: Value(asset.livePhotoVideoId),
  );
}
