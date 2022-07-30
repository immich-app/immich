import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:openapi/api.dart';

class AlbumNotifier extends StateNotifier<List<AlbumResponseDto>> {
  AlbumNotifier(this._sharedAlbumService) : super([]);
  final AlbumService _sharedAlbumService;

  getAllAlbums() async {
    List<AlbumResponseDto>? albums =
        await _sharedAlbumService.getAlbums(isShared: false);

    if (albums != null) {
      state = albums;
    }
  }
}

final albumProvider =
    StateNotifierProvider<AlbumNotifier, List<AlbumResponseDto>>((ref) {
  return AlbumNotifier(ref.watch(albumServiceProvider));
});
