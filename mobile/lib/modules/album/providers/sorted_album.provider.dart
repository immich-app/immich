import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/providers/album_sort_by_options.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sorted_album.provider.g.dart';

@riverpod
List<Album> sortedAlbum(SortedAlbumRef ref, List<Album> albums) {
  final albumSortOption = ref.watch(albumSortByOptionsProvider);
  final albumSortIsReverse = ref.watch(albumSortOrderProvider);
  return albumSortOption.sortFn(albums, albumSortIsReverse);
}
