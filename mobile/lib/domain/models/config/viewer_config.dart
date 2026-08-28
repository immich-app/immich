// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'viewer_config.freezed.dart';

@freezed
class const ViewerConfig({
  final bool loopVideo = true,
  final bool loadOriginalVideo = false,
  final bool autoPlayVideo = true,
  final bool tapToNavigate = false,
}) with _$ViewerConfig;
