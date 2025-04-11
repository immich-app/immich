import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class ILocalAlbumRepository implements IDatabaseRepository {
  Future<void> upsert(LocalAlbum localAlbum);

  Future<List<LocalAlbum>> getAll({SortLocalAlbumsBy? sortBy});

  /// Get all asset ids that are only in the album and not in other albums.
  /// This is used to determine which assets are unique to the album.
  /// This is useful in cases where the album is a smart album or a user-created album, especially in iOS
  Future<List<String>> getAssetIdsOnlyInAlbum(String albumId);

  Future<void> delete(String albumId);
}

enum SortLocalAlbumsBy { id }
