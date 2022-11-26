// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'in_app_logger_message.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class InAppLoggerMessageAdapter extends TypeAdapter<InAppLoggerMessage> {
  @override
  final int typeId = 3;

  @override
  InAppLoggerMessage read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return InAppLoggerMessage(
      message: fields[0] as String,
      level:
          fields[1] == null ? ImmichLogLevel.info : fields[1] as ImmichLogLevel,
      createdAt: fields[2] as DateTime,
      context1: fields[3] as String?,
      context2: fields[4] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, InAppLoggerMessage obj) {
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
      other is InAppLoggerMessageAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ImmichLogLevelAdapter extends TypeAdapter<ImmichLogLevel> {
  @override
  final int typeId = 4;

  @override
  ImmichLogLevel read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return ImmichLogLevel.info;
      case 1:
        return ImmichLogLevel.warning;
      case 2:
        return ImmichLogLevel.error;
      default:
        return ImmichLogLevel.info;
    }
  }

  @override
  void write(BinaryWriter writer, ImmichLogLevel obj) {
    switch (obj) {
      case ImmichLogLevel.info:
        writer.writeByte(0);
        break;
      case ImmichLogLevel.warning:
        writer.writeByte(1);
        break;
      case ImmichLogLevel.error:
        writer.writeByte(2);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ImmichLogLevelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
