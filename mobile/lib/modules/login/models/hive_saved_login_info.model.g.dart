// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_saved_login_info.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveSavedLoginInfoAdapter extends TypeAdapter<HiveSavedLoginInfo> {
  @override
  final int typeId = 0;

  @override
  HiveSavedLoginInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveSavedLoginInfo(
      email: fields[0] as String,
      password: fields[1] as String,
      serverUrl: fields[2] as String,
      accessToken: fields[4] == null ? '' : fields[4] as String,
    );
  }

  @override
  void write(BinaryWriter writer, HiveSavedLoginInfo obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.email)
      ..writeByte(1)
      ..write(obj.password)
      ..writeByte(2)
      ..write(obj.serverUrl)
      ..writeByte(4)
      ..write(obj.accessToken);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveSavedLoginInfoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
