// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/constants/enums.dart';

part 'cleanup_config.freezed.dart';

@freezed
class const CleanupConfig({
  final bool keepFavorites = true,
  final AssetKeepType keepMediaType = .none,
  final List<String> keepAlbumIds = const [],
  final int cutoffDaysAgo = -1,
  final bool defaultsInitialized = false,
}) with _$CleanupConfig;
