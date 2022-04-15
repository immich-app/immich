import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/services/shared_album.service.dart';

class SharedAlbumNotifier extends StateNotifier<List<SharedAlbum>> {
  SharedAlbumNotifier() : super([]);

  final SharedAlbumService _sharedAlbumService = SharedAlbumService();

  getAllSharedAlbums() async {
    List<SharedAlbum> sharedAlbums = await _sharedAlbumService.getAllSharedAlbum();

    state = sharedAlbums;
  }
}

final sharedAlbumProvider = StateNotifierProvider<SharedAlbumNotifier, List<SharedAlbum>>((ref) {
  return SharedAlbumNotifier();
});

final sharedAlbumDetailProvider = FutureProvider.autoDispose.family<SharedAlbum, String>((ref, albumId) async {
  final SharedAlbumService _sharedAlbumService = SharedAlbumService();

  return await _sharedAlbumService.getAlbumDetail(albumId);
});
