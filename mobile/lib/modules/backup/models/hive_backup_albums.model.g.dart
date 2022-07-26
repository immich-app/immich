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
      lastSelectedBackupTime:
          fields[2] == null ? [] : (fields[2] as List).cast<DateTime>(),
      lastExcludedBackupTime:
          fields[3] == null ? [] : (fields[3] as List).cast<DateTime>(),
    );
  }

  @override
  void write(BinaryWriter writer, HiveBackupAlbums obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.selectedAlbumIds)
      ..writeByte(1)
      ..write(obj.excludedAlbumsIds)
      ..writeByte(2)
      ..write(obj.lastSelectedBackupTime)
      ..writeByte(3)
      ..write(obj.lastExcludedBackupTime);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HiveBackupAlbumsAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
