import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';

class AlbumFilterState {
  String? userId;
  String query;
  QuickFilterMode filterMode;

  AlbumFilterState({
    this.userId,
    required this.query,
    required this.filterMode,
  });
}

class AlbumSortState {
  RemoteAlbumSortMode sortMode;
  bool isReverse;

  AlbumSortState({
    required this.sortMode,
    this.isReverse = false,
  });
}