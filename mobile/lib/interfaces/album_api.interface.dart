import 'package:immich_mobile/entities/album.entity.dart';

abstract interface class IAlbumApiRepository {
  Future<Album> get(String id);

  Future<List<Album>> getAll({bool? shared});

  Future<Album> create(
    String name, {
    required Iterable<String> assetIds,
    Iterable<String> sharedUserIds = const [],
  });

  Future<Album> update(
    String albumId, {
    String? name,
    String? thumbnailAssetId,
    String? description,
    bool? activityEnabled,
  });

  Future<void> delete(String albumId);

  Future<({List<String> added, List<String> duplicates})> addAssets(
    String albumId,
    Iterable<String> assetIds,
  );

  Future<({List<String> removed, List<String> failed})> removeAssets(
    String albumId,
    Iterable<String> assetIds,
  );

  Future<Album> addUsers(
    String albumId,
    Iterable<String> userIds,
  );

  Future<void> removeUser(String albumId, {required String userId});
}
