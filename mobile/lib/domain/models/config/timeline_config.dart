import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';

part 'timeline_config.freezed.dart';

@freezed
abstract class TimelineConfig with _$TimelineConfig {
  const factory TimelineConfig({
    @Default(4) int tilesPerRow,
    @Default(GroupAssetsBy.day) GroupAssetsBy groupAssetsBy,
    @Default(true) bool storageIndicator,
  }) = _TimelineConfig;
}
