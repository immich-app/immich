import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/album.entity.dart';
import 'package:immich_mobile/domain/entities/asset.entity.dart';

class AlbumToAsset extends Table {
  const AlbumToAsset();

  IntColumn get assetId =>
      integer().references(Asset, #id, onDelete: KeyAction.cascade)();

  IntColumn get albumId =>
      integer().references(Album, #id, onDelete: KeyAction.cascade)();

  @override
  Set<Column> get primaryKey => {assetId, albumId};
}
