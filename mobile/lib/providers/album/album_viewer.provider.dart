import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/albums/album_viewer_page_state.model.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/entities/album.entity.dart';

class AlbumViewerNotifier extends StateNotifier<AlbumViewerPageState> {
  AlbumViewerNotifier(this.ref)
      : super(AlbumViewerPageState(editTitleText: "", isEditAlbum: false));

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

  Future<bool> changeAlbumTitle(
    Album album,
    String newAlbumTitle,
  ) async {
    AlbumService service = ref.watch(albumServiceProvider);

    bool isSuccess = await service.changeTitleAlbum(album, newAlbumTitle);

    if (isSuccess) {
      state = state.copyWith(editTitleText: "", isEditAlbum: false);

      return true;
    }

    state = state.copyWith(editTitleText: "", isEditAlbum: false);
    return false;
  }
}

final albumViewerProvider =
    StateNotifierProvider<AlbumViewerNotifier, AlbumViewerPageState>((ref) {
  return AlbumViewerNotifier(ref);
});
