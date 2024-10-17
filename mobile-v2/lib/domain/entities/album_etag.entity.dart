import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/album.entity.dart';

class AlbumETag extends Table {
  const AlbumETag();

  IntColumn get id => integer().autoIncrement()();

  IntColumn get albumId =>
      integer().references(Album, #id, onDelete: KeyAction.cascade).unique()();
  DateTimeColumn get modifiedTime =>
      dateTime().withDefault(currentDateAndTime)();
  IntColumn get assetCount => integer().withDefault(const Constant(0))();
}
