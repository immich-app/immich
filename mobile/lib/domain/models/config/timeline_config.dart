import 'package:immich_mobile/domain/models/timeline.model.dart';

class TimelineConfig {
  final int tilesPerRow;
  final GroupAssetsBy groupAssetsBy;
  final bool storageIndicator;

  const TimelineConfig({this.tilesPerRow = 4, this.groupAssetsBy = GroupAssetsBy.day, this.storageIndicator = true});

  TimelineConfig copyWith({int? tilesPerRow, GroupAssetsBy? groupAssetsBy, bool? storageIndicator}) => TimelineConfig(
    tilesPerRow: tilesPerRow ?? this.tilesPerRow,
    groupAssetsBy: groupAssetsBy ?? this.groupAssetsBy,
    storageIndicator: storageIndicator ?? this.storageIndicator,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TimelineConfig &&
          other.tilesPerRow == tilesPerRow &&
          other.groupAssetsBy == groupAssetsBy &&
          other.storageIndicator == storageIndicator);

  @override
  int get hashCode => Object.hash(tilesPerRow, groupAssetsBy, storageIndicator);

  @override
  String toString() =>
      'TimelineConfig(tilesPerRow: $tilesPerRow, groupAssetsBy: $groupAssetsBy, storageIndicator: $storageIndicator)';
}
