// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hive_backup_albums.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HiveBackupAlbumsAdapter extends TypeAdapter<HiveBackupAlbums> {
  @override
  final int typeId = 1;

  @override
  HiveBackupAlbums read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return HiveBackupAlbums(
      selectedAlbumIds: (fields[0] as List).cast<String>(),
      excludedAlbumsIds: (fields[1] as List).cast<String>(),
    );
  }

  @override
  void write(BinaryWriter writer, HiveBackupAlbums obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.selectedAlbumIds)
      ..writeByte(1)
      ..write(obj.excludedAlbumsIds);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveBackupAlbumsAdapter && runtimeType == other.runtimeType && typeId == other.typeId;
}
