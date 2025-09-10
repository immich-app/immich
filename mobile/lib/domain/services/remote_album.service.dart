import 'dart:async';

import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';

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

  Future<RemoteAlbum?> get(String albumId) {
    return _repository.get(albumId);
  }

  Future<RemoteAlbum?> getByName(String albumName, String ownerId) {
    return _repository.getByName(albumName, ownerId);
  }

  Future<List<RemoteAlbum>> sortAlbums(
    List<RemoteAlbum> albums,
    RemoteAlbumSortMode sortMode, {
    bool isReverse = false,
  }) async {
    final List<RemoteAlbum> sorted = switch (sortMode) {
      RemoteAlbumSortMode.created => albums.sortedBy((album) => album.createdAt),
      RemoteAlbumSortMode.title => albums.sortedBy((album) => album.name),
      RemoteAlbumSortMode.lastModified => albums.sortedBy((album) => album.updatedAt),
      RemoteAlbumSortMode.assetCount => albums.sortedBy((album) => album.assetCount),
      RemoteAlbumSortMode.mostRecent => await _sortByNewestAsset(albums),
      RemoteAlbumSortMode.mostOldest => await _sortByOldestAsset(albums),
    };

    return (isReverse ? sorted.reversed : sorted).toList();
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
                album.name.toLowerCase().contains(lowerQuery) || album.description.toLowerCase().contains(lowerQuery),
          )
          .toList();
    }

    if (userId != null) {
      switch (filterMode) {
        case QuickFilterMode.myAlbums:
          filtered = filtered.where((album) => album.ownerId == userId).toList();
          break;
        case QuickFilterMode.sharedWithMe:
          filtered = filtered.where((album) => album.ownerId != userId).toList();
          break;
        case QuickFilterMode.all:
          break;
      }
    }

    return filtered;
  }

  Future<RemoteAlbum> createAlbum({required String title, required List<String> assetIds, String? description}) async {
    final album = await _albumApiRepository.createDriftAlbum(title, description: description, assetIds: assetIds);
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

  Future<int> addAssets({required String albumId, required List<String> assetIds}) async {
    final album = await _albumApiRepository.addAssets(albumId, assetIds);

    await _repository.addAssets(albumId, album.added);

    return album.added.length;
  }

  Future<void> deleteAlbum(String albumId) async {
    await _albumApiRepository.deleteAlbum(albumId);

    await _repository.deleteAlbum(albumId);
  }

  Future<void> addUsers({required String albumId, required List<String> userIds}) async {
    await _albumApiRepository.addUsers(albumId, userIds);

    return _repository.addUsers(albumId, userIds);
  }

  Future<void> removeUser(String albumId, {required String userId}) async {
    await _albumApiRepository.removeUser(albumId, userId: userId);

    return _repository.removeUser(albumId, userId: userId);
  }

  Future<void> setActivityStatus(String albumId, bool enabled) async {
    await _albumApiRepository.setActivityStatus(albumId, enabled);

    return _repository.setActivityStatus(albumId, enabled);
  }

  Future<int> getCount() {
    return _repository.getCount();
  }

  Future<List<RemoteAlbum>> _sortByNewestAsset(List<RemoteAlbum> albums) async {
    // map album IDs to their newest asset dates
    final Map<String, Future<DateTime?>> assetTimestampFutures = {};
    for (final album in albums) {
      assetTimestampFutures[album.id] = _repository.getNewestAssetTimestamp(album.id);
    }

    // await all database queries
    final entries = await Future.wait(
      assetTimestampFutures.entries.map((entry) async => MapEntry(entry.key, await entry.value)),
    );
    final assetTimestamps = Map.fromEntries(entries);

    final sorted = albums.sorted((a, b) {
      final aDate = assetTimestamps[a.id] ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bDate = assetTimestamps[b.id] ?? DateTime.fromMillisecondsSinceEpoch(0);
      return aDate.compareTo(bDate);
    });

    return sorted;
  }

  Future<List<RemoteAlbum>> _sortByOldestAsset(List<RemoteAlbum> albums) async {
    // map album IDs to their oldest asset dates
    final Map<String, Future<DateTime?>> assetTimestampFutures = {
      for (final album in albums) album.id: _repository.getOldestAssetTimestamp(album.id),
    };

    // await all database queries
    final entries = await Future.wait(
      assetTimestampFutures.entries.map((entry) async => MapEntry(entry.key, await entry.value)),
    );
    final assetTimestamps = Map.fromEntries(entries);

    final sorted = albums.sorted((a, b) {
      final aDate = assetTimestamps[a.id] ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bDate = assetTimestamps[b.id] ?? DateTime.fromMillisecondsSinceEpoch(0);
      return aDate.compareTo(bDate);
    });

    return sorted.reversed.toList();
  }
}

enum RemoteAlbumSortMode {
  title("library_page_sort_title"),
  assetCount("library_page_sort_asset_count"),
  lastModified("library_page_sort_last_modified"),
  created("library_page_sort_created"),
  mostRecent("sort_newest"),
  mostOldest("sort_oldest");

  final String key;

  const RemoteAlbumSortMode(this.key);
}
