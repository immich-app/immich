import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

part 'album_config.freezed.dart';

@freezed
abstract class AlbumConfig with _$AlbumConfig {
  const factory AlbumConfig({
    @Default(AlbumSortMode.mostRecent) AlbumSortMode sortMode,
    @Default(true) bool isReverse,
    @Default(false) bool isGrid,
  }) = _AlbumConfig;
}
