import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

class AlbumConfig {
  final AlbumSortMode sortMode;
  final bool isReverse;
  final bool isGrid;

  const AlbumConfig({this.sortMode = AlbumSortMode.mostRecent, this.isReverse = true, this.isGrid = false});

  AlbumConfig copyWith({AlbumSortMode? sortMode, bool? isReverse, bool? isGrid}) => AlbumConfig(
    sortMode: sortMode ?? this.sortMode,
    isReverse: isReverse ?? this.isReverse,
    isGrid: isGrid ?? this.isGrid,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AlbumConfig && other.sortMode == sortMode && other.isReverse == isReverse && other.isGrid == isGrid);

  @override
  int get hashCode => Object.hash(sortMode, isReverse, isGrid);

  @override
  String toString() => 'AlbumConfig(sortMode: $sortMode, isReverse: $isReverse, isGrid: $isGrid)';
}
