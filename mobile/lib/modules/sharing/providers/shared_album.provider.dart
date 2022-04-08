import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/services/shared_album.service.dart';

class SharedAlbumNotifier extends StateNotifier<List<int>> {
  SharedAlbumNotifier() : super([]);

  final SharedAlbumService _sharedAlbumService = SharedAlbumService();

  getAllSharedAlbums() async {
    List<SharedAlbum> sharedAlbums = await _sharedAlbumService.getAllSharedAlbum();

    print(sharedAlbums);
  }
}

final sharedAlbumProvider = StateNotifierProvider((ref) {
  return SharedAlbumNotifier();
});
