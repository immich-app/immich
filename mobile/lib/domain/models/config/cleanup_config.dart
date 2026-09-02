import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/constants/enums.dart';

part 'cleanup_config.freezed.dart';

@freezed
abstract class CleanupConfig with _$CleanupConfig {
  const factory CleanupConfig({
    @Default(true) bool keepFavorites,
    @Default(AssetKeepType.none) AssetKeepType keepMediaType,
    @Default([]) List<String> keepAlbumIds,
    @Default(-1) int cutoffDaysAgo,
    @Default(false) bool defaultsInitialized,
  }) = _CleanupConfig;
}
