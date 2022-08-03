import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:openapi/api.dart';

class AlbumNotifier extends StateNotifier<List<AlbumResponseDto>> {
  AlbumNotifier(this._albumService) : super([]);
  final AlbumService _albumService;

  getAllAlbums() async {
    List<AlbumResponseDto>? albums =
        await _albumService.getAlbums(isShared: false);

    if (albums != null) {
      state = albums;
    }
  }

  deleteAlbum(String albumId) {
    state = state.where((album) => album.id != albumId).toList();
  }

  Future<AlbumResponseDto?> createAlbum(
      String albumTitle, Set<AssetResponseDto> assets) async {
    AlbumResponseDto? album =
        await _albumService.createAlbum(albumTitle, assets, []);

    if (album != null) {
      state = [...state, album];
      return album;
    }
    return null;
  }
}

final albumProvider =
    StateNotifierProvider<AlbumNotifier, List<AlbumResponseDto>>((ref) {
  return AlbumNotifier(ref.watch(albumServiceProvider));
});
