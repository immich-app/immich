// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_backup_assets.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveBackupAssetsAdapter extends TypeAdapter<HiveBackupAssets> {
  @override
  final int typeId = 2;

  @override
  HiveBackupAssets read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveBackupAssets(
      assetId: fields[0] as String,
      deviceAssetId: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, HiveBackupAssets obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.assetId)
      ..writeByte(1)
      ..write(obj.deviceAssetId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveBackupAssetsAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
