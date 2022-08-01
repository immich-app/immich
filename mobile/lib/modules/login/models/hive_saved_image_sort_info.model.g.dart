// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_saved_image_sort_info.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveSavedImageSortInfoAdapter
    extends TypeAdapter<HiveSavedImageSortInfo> {
  @override
  final int typeId = 2;

  @override
  HiveSavedImageSortInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveSavedImageSortInfo(
      list: (fields[0] as List).cast<AssetResponseDto>(),
    );
  }

  @override
  void write(BinaryWriter writer, HiveSavedImageSortInfo obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.list);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveSavedImageSortInfoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
