import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/album_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/sharing/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/sharing/services/shared_album.service.dart';

class AlbumViewerNotifier extends StateNotifier<AlbumViewerPageState> {
  AlbumViewerNotifier(this.ref) : super(AlbumViewerPageState(editTitleText: "", isEditAlbum: false));

  final Ref ref;

  void enableEditAlbum() {
    state = state.copyWith(isEditAlbum: true);
  }

  void disableEditAlbum() {
    state = state.copyWith(isEditAlbum: false);
  }

  void setEditTitleText(String newTitle) {
    state = state.copyWith(editTitleText: newTitle);
  }

  void remoteEditTitleText() {
    state = state.copyWith(editTitleText: "");
  }

  void resetState() {
    state = state.copyWith(editTitleText: "", isEditAlbum: false);
  }

  Future<bool> changeAlbumTitle(String albumId, String ownerId, String newAlbumTitle) async {
    SharedAlbumService service = SharedAlbumService();

    bool isSuccess = await service.changeTitleAlbum(albumId, ownerId, newAlbumTitle);

    if (isSuccess) {
      state = state.copyWith(editTitleText: "", isEditAlbum: false);
      ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();

      return true;
    }

    state = state.copyWith(editTitleText: "", isEditAlbum: false);
    return false;
  }
}

final albumViewerProvider = StateNotifierProvider<AlbumViewerNotifier, AlbumViewerPageState>((ref) {
  return AlbumViewerNotifier(ref);
});
