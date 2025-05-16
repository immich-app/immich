import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class LocalAlbumAssetEntity extends Table with DriftDefaultsMixin {
  const LocalAlbumAssetEntity();

  TextColumn get assetId =>
      text().references(LocalAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get albumId =>
      text().references(LocalAlbumEntity, #id, onDelete: KeyAction.cascade)();

  @override
  Set<Column> get primaryKey => {assetId, albumId};
}
