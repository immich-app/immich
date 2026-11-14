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
    @Default(true) bool videoIndicator,
    @Default(true) bool livePhotoIndicator,
    @Default(true) bool animatedImageIndicator,
    @Default(true) bool rawIndicator,
    @Default(true) bool stackIndicator,
    @Default(true) bool favoriteIndicator,
    @Default(false) bool smoothScrubbing,
  }) = _TimelineConfig;
}
