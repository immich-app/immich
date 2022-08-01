// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_asset_type_enum_info.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveAssetTypeEnumAdapter extends TypeAdapter<HiveAssetTypeEnum> {
  @override
  final int typeId = 4;

  @override
  HiveAssetTypeEnum read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveAssetTypeEnum(
      value: fields[0] as String,
    );
  }

  @override
  void write(BinaryWriter writer, HiveAssetTypeEnum obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.value);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveAssetTypeEnumAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
