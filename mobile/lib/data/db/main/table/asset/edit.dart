import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/asset/edit.drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/asset.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/extensions/object_extensions.dart';
import 'package:openapi/api.dart' hide AssetEditAction;

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_asset_edit_asset_id ON asset_edit_entity (asset_id)')
class AssetEditEntity extends Table with DriftDefaultsMixin {
  const AssetEditEntity();

  TextColumn get id => text()();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get action => intEnum<AssetEditAction>()();

  BlobColumn get parameters => blob().map(editParameterConverter)();

  IntColumn get sequence => integer()();

  @override
  Set<Column> get primaryKey => {id};
}

final JsonTypeConverter2<Map<String, Object?>, Uint8List, Object?> editParameterConverter = TypeConverter.jsonb(
  fromJson: (json) => json! as Map<String, Object?>,
);

extension AssetEditEntityDataDomainEx on AssetEditEntityData {
  AssetEdit? toDto() {
    return switch (action) {
      AssetEditAction.crop => CropParameters.fromJson(parameters)?.let(CropEdit.new),
      AssetEditAction.rotate => RotateParameters.fromJson(parameters)?.let(RotateEdit.new),
      AssetEditAction.mirror => MirrorParameters.fromJson(parameters)?.let(MirrorEdit.new),
      AssetEditAction.other => null,
    };
  }
}
