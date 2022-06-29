import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/services/shared_album.service.dart';

class SharedAlbumNotifier extends StateNotifier<List<SharedAlbum>> {
  SharedAlbumNotifier(this._sharedAlbumService) : super([]);

  final SharedAlbumService _sharedAlbumService;

  getAllSharedAlbums() async {
    List<SharedAlbum> sharedAlbums =
        await _sharedAlbumService.getAllSharedAlbum();

    state = sharedAlbums;
  }

  Future<bool> deleteAlbum(String albumId) async {
    var res = await _sharedAlbumService.deleteAlbum(albumId);

    if (res) {
      state = state.where((album) => album.id != albumId).toList();
      return true;
    } else {
      return false;
    }
  }

  Future<bool> leaveAlbum(String albumId) async {
    var res = await _sharedAlbumService.leaveAlbum(albumId);

    if (res) {
      state = state.where((album) => album.id != albumId).toList();
      return true;
    } else {
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
      String albumId, List<String> assetIds) async {
    var res = await _sharedAlbumService.removeAssetFromAlbum(albumId, assetIds);

    if (res) {
      return true;
    } else {
      return false;
    }
  }
}

final sharedAlbumProvider =
    StateNotifierProvider<SharedAlbumNotifier, List<SharedAlbum>>((ref) {
  return SharedAlbumNotifier(ref.watch(sharedAlbumServiceProvider));
});

final sharedAlbumDetailProvider = FutureProvider.autoDispose
    .family<SharedAlbum, String>((ref, albumId) async {
  final SharedAlbumService sharedAlbumService =
      ref.watch(sharedAlbumServiceProvider);

  return await sharedAlbumService.getAlbumDetail(albumId);
});
