// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_asset_responsedto_info.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveAssetResponseDtoAdapter extends TypeAdapter<AssetResponseDto> {
  @override
  final int typeId = 3;

  @override
  AssetResponseDto read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AssetResponseDto(
      fields[0] as AssetTypeEnum,
      fields[1] as String,
      fields[2] as String,
      fields[3] as String,
      fields[4] as String,
      fields[5] as String,
      fields[6] as String,
      fields[7] as String,
      fields[8] as String,
      fields[9] as bool,
      fields[10] as String?,
      fields[11] as String,
      fields[12] as String?,
      fields[13] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, AssetResponseDto obj) {
    writer
      ..writeByte(14)
      ..writeByte(0)
      ..write(obj.type)
      ..writeByte(1)
      ..write(obj.id)
      ..writeByte(2)
      ..write(obj.createdAt)
      ..writeByte(3)
      ..write(obj.deviceAssetId)
      ..writeByte(4)
      ..write(obj.ownerId)
      ..writeByte(5)
      ..write(obj.deviceId)
      ..writeByte(6)
      ..write(obj.originalPath)
      ..writeByte(7)
      ..write(obj.resizePath)
      ..writeByte(8)
      ..write(obj.modifiedAt)
      ..writeByte(9)
      ..write(obj.isFavorite)
      ..writeByte(10)
      ..write(obj.mimeType)
      ..writeByte(11)
      ..write(obj.duration)
      ..writeByte(12)
      ..write(obj.webpPath)
      ..writeByte(13)
      ..write(obj.encodedVideoPath);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveAssetResponseDtoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
