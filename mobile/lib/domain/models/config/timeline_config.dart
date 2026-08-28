// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';

part 'timeline_config.freezed.dart';

@freezed
class const TimelineConfig({
  final int tilesPerRow = 4,
  final GroupAssetsBy groupAssetsBy = .day,
  final bool storageIndicator = true,
}) with _$TimelineConfig;
