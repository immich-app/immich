import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/asset.entity.dart';

class LocalAsset extends Asset {
  const LocalAsset();

  TextColumn get localId => text().unique()();
}
