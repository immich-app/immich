import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/services/shared_album.service.dart';

class SharedAlbumNotifier extends StateNotifier<List<int>> {
  SharedAlbumNotifier() : super([]);

  final SharedAlbumService _sharedAlbumService = SharedAlbumService();

  getAllSharedAlbums() async {
    await _sharedAlbumService.getAllSharedAlbum();
  }
}

final sharedAlbumProvider = StateNotifierProvider((ref) {
  return SharedAlbumNotifier();
});
