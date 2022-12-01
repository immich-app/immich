// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'immich_logger_message.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ImmichLoggerMessageAdapter extends TypeAdapter<ImmichLoggerMessage> {
  @override
  final int typeId = 3;

  @override
  ImmichLoggerMessage read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ImmichLoggerMessage(
      message: fields[0] as String,
      level: fields[1] == null ? 'INFO' : fields[1] as String,
      createdAt: fields[2] as DateTime,
      context1: fields[3] as String?,
      context2: fields[4] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, ImmichLoggerMessage obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.message)
      ..writeByte(1)
      ..write(obj.level)
      ..writeByte(2)
      ..write(obj.createdAt)
      ..writeByte(3)
      ..write(obj.context1)
      ..writeByte(4)
      ..write(obj.context2);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ImmichLoggerMessageAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
