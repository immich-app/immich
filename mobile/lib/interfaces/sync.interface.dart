import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/database.interface.dart';
import 'package:openapi/api.dart';

abstract interface class ISyncRepository implements IDatabaseRepository {
  void Function(List<Asset>)? onAssetUpserted;
  void Function(List<String>)? onAssetDeleted;

  void Function(Album)? onAlbumAdded;
  void Function(Album)? onAlbumDeleted;
  void Function(Album)? onAlbumUpdated;

  Future<void> fullSync();
  Future<void> incrementalSync({
    required List<SyncStreamDtoTypesEnum> types,
    required int batchSize,
  });
}
