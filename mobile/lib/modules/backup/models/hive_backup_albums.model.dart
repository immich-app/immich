import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hive/hive.dart';

part 'hive_backup_albums.model.g.dart';

@HiveType(typeId: 1)
class HiveBackupAlbums {
  @HiveField(0)
  List<String> selectedAlbumIds;

  @HiveField(1)
  List<String> excludedAlbumsIds;

  HiveBackupAlbums({
    required this.selectedAlbumIds,
    required this.excludedAlbumsIds,
  });

  @override
  String toString() =>
      'HiveBackupAlbums(selectedAlbumIds: $selectedAlbumIds, excludedAlbumsIds: $excludedAlbumsIds)';

  HiveBackupAlbums copyWith({
    List<String>? selectedAlbumIds,
    List<String>? excludedAlbumsIds,
  }) {
    return HiveBackupAlbums(
      selectedAlbumIds: selectedAlbumIds ?? this.selectedAlbumIds,
      excludedAlbumsIds: excludedAlbumsIds ?? this.excludedAlbumsIds,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedAlbumIds': selectedAlbumIds});
    result.addAll({'excludedAlbumsIds': excludedAlbumsIds});

    return result;
  }

  factory HiveBackupAlbums.fromMap(Map<String, dynamic> map) {
    return HiveBackupAlbums(
      selectedAlbumIds: List<String>.from(map['selectedAlbumIds']),
      excludedAlbumsIds: List<String>.from(map['excludedAlbumsIds']),
    );
  }

  String toJson() => json.encode(toMap());

  factory HiveBackupAlbums.fromJson(String source) =>
      HiveBackupAlbums.fromMap(json.decode(source));

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is HiveBackupAlbums &&
        listEquals(other.selectedAlbumIds, selectedAlbumIds) &&
        listEquals(other.excludedAlbumsIds, excludedAlbumsIds);
  }

  @override
  int get hashCode => selectedAlbumIds.hashCode ^ excludedAlbumsIds.hashCode;
}
