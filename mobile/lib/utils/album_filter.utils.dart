// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

part 'album_filter.utils.freezed.dart';

@freezed
class const AlbumFilter({required final QuickFilterMode mode, final String? userId, final String? query})
    with _$AlbumFilter;

@freezed
class const AlbumSort({required final AlbumSortMode mode, final bool isReverse = false}) with _$AlbumSort;
