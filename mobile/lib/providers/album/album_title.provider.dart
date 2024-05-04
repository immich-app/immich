import 'package:hooks_riverpod/hooks_riverpod.dart';

class AlbumTitleNotifier extends StateNotifier<String> {
  AlbumTitleNotifier() : super("");

  setAlbumTitle(String title) {
    state = title;
  }

  clearAlbumTitle() {
    state = "";
  }
}

final albumTitleProvider = StateNotifierProvider<AlbumTitleNotifier, String>(
  (ref) => AlbumTitleNotifier(),
);
