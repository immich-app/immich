import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/database.interface.dart';

abstract interface class ISyncRepository implements IDatabaseRepository {
  void Function(Asset)? onAssetAdded;
  void Function(Asset)? onAssetDeleted;
  void Function(Asset)? onAssetUpdated;

  void Function(Album)? onAlbumAdded;
  void Function(Album)? onAlbumDeleted;
  void Function(Album)? onAlbumUpdated;

  Future<void> fullSync();
  Future<void> incrementalSync();
}
