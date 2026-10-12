import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/album.dart';
import 'package:immich_mobile/data/db/main/table/user/user.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';

class RemoteAlbumUserEntity extends Table with DriftDefaultsMixin {
  const RemoteAlbumUserEntity();

  TextColumn get albumId => text().references(RemoteAlbumEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get userId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get role => intEnum<AlbumUserRole>()();

  @override
  Set<Column> get primaryKey => {albumId, userId};
}
