// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/constants/enums.dart';

part 'slideshow_config.freezed.dart';

@freezed
class const SlideshowConfig({
  final bool repeat = true,
  final int duration = 5,
  final SlideshowLook look = .blurredBackground,
  final SlideshowDirection direction = .forward,
}) with _$SlideshowConfig;
