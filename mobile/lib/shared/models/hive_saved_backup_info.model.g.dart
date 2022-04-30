// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_saved_backup_info.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveSavedBackupInfoAdapter extends TypeAdapter<HiveSavedBackupInfo> {
  @override
  final int typeId = 1;

  @override
  HiveSavedBackupInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveSavedBackupInfo(
      assetEntityId: fields[0] as String,
    );
  }

  @override
  void write(BinaryWriter writer, HiveSavedBackupInfo obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.assetEntityId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveSavedBackupInfoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
