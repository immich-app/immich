// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_duplicated_assets.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveDuplicatedAssetsAdapter extends TypeAdapter<HiveDuplicatedAssets> {
  @override
  final int typeId = 2;

  @override
  HiveDuplicatedAssets read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveDuplicatedAssets(
      duplicatedAssetIds:
          fields[0] == null ? [] : (fields[0] as List).cast<String>(),
    );
  }

  @override
  void write(BinaryWriter writer, HiveDuplicatedAssets obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.duplicatedAssetIds);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveDuplicatedAssetsAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
