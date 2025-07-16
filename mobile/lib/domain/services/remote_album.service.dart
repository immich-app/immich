import 'dart:async';

import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/utils/remote_album.utils.dart';

class RemoteAlbumService {
  final DriftRemoteAlbumRepository _repository;
  final DriftAlbumApiRepository _albumApiRepository;

  const RemoteAlbumService(this._repository, this._albumApiRepository);

  Stream<RemoteAlbum?> watchAlbum(String albumId) {
    return _repository.watchAlbum(albumId);
  }

  Future<List<RemoteAlbum>> getAll() {
    return _repository.getAll();
  }

  List<RemoteAlbum> sortAlbums(
    List<RemoteAlbum> albums,
    RemoteAlbumSortMode sortMode, {
    bool isReverse = false,
  }) {
    return sortMode.sortFn(albums, isReverse);
  }

  List<RemoteAlbum> searchAlbums(
    List<RemoteAlbum> albums,
    String query,
    String? userId, [
    QuickFilterMode filterMode = QuickFilterMode.all,
  ]) {
    final lowerQuery = query.toLowerCase();
    List<RemoteAlbum> filtered = albums;

    // Apply text search filter
    if (query.isNotEmpty) {
      filtered = filtered
          .where(
            (album) =>
                album.name.toLowerCase().contains(lowerQuery) ||
                album.description.toLowerCase().contains(lowerQuery),
          )
          .toList();
    }

    if (userId != null) {
      switch (filterMode) {
        case QuickFilterMode.myAlbums:
          filtered =
              filtered.where((album) => album.ownerId == userId).toList();
          break;
        case QuickFilterMode.sharedWithMe:
          filtered =
              filtered.where((album) => album.ownerId != userId).toList();
          break;
        case QuickFilterMode.all:
          break;
      }
    }

    return filtered;
  }

  Future<RemoteAlbum> createAlbum({
    required String title,
    required List<String> assetIds,
    String? description,
  }) async {
    final album = await _albumApiRepository.createDriftAlbum(
      title,
      description: description,
      assetIds: assetIds,
    );

    await _repository.create(album, assetIds);

    return album;
  }

  Future<RemoteAlbum> updateAlbum(
    String albumId, {
    String? name,
    String? description,
    String? thumbnailAssetId,
    bool? isActivityEnabled,
    AlbumAssetOrder? order,
  }) async {
    final updatedAlbum = await _albumApiRepository.updateAlbum(
      albumId,
      name: name,
      description: description,
      thumbnailAssetId: thumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order: order,
    );

    // Update the local database
    await _repository.update(updatedAlbum);

    return updatedAlbum;
  }

  FutureOr<(DateTime, DateTime)> getDateRange(String albumId) {
    return _repository.getDateRange(albumId);
  }

  Future<List<UserDto>> getSharedUsers(String albumId) {
    return _repository.getSharedUsers(albumId);
  }

  Future<List<RemoteAsset>> getAssets(String albumId) {
    return _repository.getAssets(albumId);
  }

  Future<int> addAssets({
    required String albumId,
    required List<String> assetIds,
  }) async {
    final album = await _albumApiRepository.addAssets(
      albumId,
      assetIds,
    );

    await _repository.addAssets(albumId, album.added);

    return album.added.length;
  }

  Future<void> deleteAlbum(String albumId) async {
    await _albumApiRepository.deleteAlbum(albumId);

    await _repository.deleteAlbum(albumId);
  }

  Future<void> addUsers({
    required String albumId,
    required List<String> userIds,
  }) async {
    await _albumApiRepository.addUsers(albumId, userIds);

    return _repository.addUsers(albumId, userIds);
  }
}
