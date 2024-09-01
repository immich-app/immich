import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/asset.entity.dart';

class RemoteAsset extends Asset {
  const RemoteAsset();

  TextColumn get remoteId => text()();
  TextColumn get livePhotoVideoId => text().nullable()();

  @override
  Set<Column> get primaryKey => {remoteId};
}
