import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album_user.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class AlbumUserEntity extends Table with DriftDefaultsMixin {
  const AlbumUserEntity();

  TextColumn get albumId =>
      text().references(RemoteAlbumEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get userId =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get role => intEnum<AlbumUserRole>()();

  @override
  Set<Column> get primaryKey => {albumId, userId};
}
