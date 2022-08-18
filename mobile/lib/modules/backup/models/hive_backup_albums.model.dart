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

  @HiveField(2, defaultValue: [])
  List<DateTime> lastSelectedBackupTime;

  @HiveField(3, defaultValue: [])
  List<DateTime> lastExcludedBackupTime;

  HiveBackupAlbums({
    required this.selectedAlbumIds,
    required this.excludedAlbumsIds,
    required this.lastSelectedBackupTime,
    required this.lastExcludedBackupTime,
  });

  @override
  String toString() =>
      'HiveBackupAlbums(selectedAlbumIds: $selectedAlbumIds, excludedAlbumsIds: $excludedAlbumsIds)';

  HiveBackupAlbums copyWith({
    List<String>? selectedAlbumIds,
    List<String>? excludedAlbumsIds,
    List<DateTime>? lastSelectedBackupTime,
    List<DateTime>? lastExcludedBackupTime,
  }) {
    return HiveBackupAlbums(
      selectedAlbumIds: selectedAlbumIds ?? this.selectedAlbumIds,
      excludedAlbumsIds: excludedAlbumsIds ?? this.excludedAlbumsIds,
      lastSelectedBackupTime:
          lastSelectedBackupTime ?? this.lastSelectedBackupTime,
      lastExcludedBackupTime:
          lastExcludedBackupTime ?? this.lastExcludedBackupTime,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedAlbumIds': selectedAlbumIds});
    result.addAll({'excludedAlbumsIds': excludedAlbumsIds});
    result.addAll({'lastSelectedBackupTime': lastSelectedBackupTime});
    result.addAll({'lastExcludedBackupTime': lastExcludedBackupTime});

    return result;
  }

  factory HiveBackupAlbums.fromMap(Map<String, dynamic> map) {
    return HiveBackupAlbums(
      selectedAlbumIds: List<String>.from(map['selectedAlbumIds']),
      excludedAlbumsIds: List<String>.from(map['excludedAlbumsIds']),
      lastSelectedBackupTime:
          List<DateTime>.from(map['lastSelectedBackupTime']),
      lastExcludedBackupTime:
          List<DateTime>.from(map['lastExcludedBackupTime']),
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
        listEquals(other.excludedAlbumsIds, excludedAlbumsIds) &&
        listEquals(other.lastSelectedBackupTime, lastSelectedBackupTime) &&
        listEquals(other.lastExcludedBackupTime, lastExcludedBackupTime);
  }

  @override
  int get hashCode =>
      selectedAlbumIds.hashCode ^
      excludedAlbumsIds.hashCode ^
      lastSelectedBackupTime.hashCode ^
      lastExcludedBackupTime.hashCode;
}
