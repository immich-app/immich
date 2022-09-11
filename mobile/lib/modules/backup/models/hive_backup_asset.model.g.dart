// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_backup_asset.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveBackupAssetAdapter extends TypeAdapter<HiveBackupAsset> {
  @override
  final int typeId = 2;

  @override
  HiveBackupAsset read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveBackupAsset(
      assetId: fields[0] as String,
    );
  }

  @override
  void write(BinaryWriter writer, HiveBackupAsset obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.assetId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveBackupAssetAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
