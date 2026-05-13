import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_asset_ocr_asset_id ON asset_ocr_entity (asset_id)')
class AssetOcrEntity extends Table with DriftDefaultsMixin {
  const AssetOcrEntity();

  TextColumn get id => text()();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  RealColumn get x1 => real()();
  RealColumn get y1 => real()();

  RealColumn get x2 => real()();
  RealColumn get y2 => real()();

  RealColumn get x3 => real()();
  RealColumn get y3 => real()();

  RealColumn get x4 => real()();
  RealColumn get y4 => real()();

  RealColumn get boxScore => real()();
  RealColumn get textScore => real()();

  TextColumn get recognizedText => text()();

  BoolColumn get isVisible => boolean().withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}
