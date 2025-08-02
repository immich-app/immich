import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class AssetFaceEntity extends Table with DriftDefaultsMixin {
  const AssetFaceEntity();

  TextColumn get id => text()();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get personId => text().nullable().references(PersonEntity, #id, onDelete: KeyAction.setNull)();

  IntColumn get imageWidth => integer()();

  IntColumn get imageHeight => integer()();

  IntColumn get boundingBoxX1 => integer()();

  IntColumn get boundingBoxY1 => integer()();

  IntColumn get boundingBoxX2 => integer()();

  IntColumn get boundingBoxY2 => integer()();

  TextColumn get sourceType => text()();

  @override
  Set<Column> get primaryKey => {id};
}
