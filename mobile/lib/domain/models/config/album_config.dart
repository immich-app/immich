// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

part 'album_config.freezed.dart';

@freezed
class const AlbumConfig({
  final AlbumSortMode sortMode = .mostRecent,
  final bool isReverse = true,
  final bool isGrid = false,
}) with _$AlbumConfig;
