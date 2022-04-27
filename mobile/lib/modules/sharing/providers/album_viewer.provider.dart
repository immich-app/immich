import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/album_viewer_page_state.model.dart';

class AlbumViewerNotifier extends StateNotifier<AlbumViewerPageState> {
  AlbumViewerNotifier() : super(AlbumViewerPageState(editTitleText: "", isEditAlbum: false));

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

  void changeAlbumTitle(String newTitle) {}
}

final albumViewerProvider = StateNotifierProvider<AlbumViewerNotifier, AlbumViewerPageState>((ref) {
  return AlbumViewerNotifier();
});
