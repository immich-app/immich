import 'package:hooks_riverpod/legacy.dart';

class AlbumTitleNotifier extends StateNotifier<String> {
  AlbumTitleNotifier() : super("");

  setAlbumTitle(String title) {
    state = title;
  }

  clearAlbumTitle() {
    state = "";
  }
}

final albumTitleProvider = StateNotifierProvider<AlbumTitleNotifier, String>((ref) => AlbumTitleNotifier());
