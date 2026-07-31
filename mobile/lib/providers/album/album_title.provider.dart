import 'package:hooks_riverpod/hooks_riverpod.dart';

class AlbumTitleNotifier extends StateNotifier<String> {
  AlbumTitleNotifier() : super("");

  void setAlbumTitle(String title) {
    state = title;
  }

  void clearAlbumTitle() {
    state = "";
  }
}

final albumTitleProvider = StateNotifierProvider<AlbumTitleNotifier, String>((ref) => AlbumTitleNotifier());
