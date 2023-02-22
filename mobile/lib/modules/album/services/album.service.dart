import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

final albumServiceProvider = Provider(
  (ref) => AlbumService(
    ref.watch(apiServiceProvider),
  ),
);

class AlbumService {
  final ApiService _apiService;

  AlbumService(this._apiService);

  Future<List<Album>?> getAlbums({required bool isShared}) async {
    try {
      final dto = await _apiService.albumApi
          .getAllAlbums(shared: isShared ? isShared : null);
      return dto?.map(Album.remote).toList();
    } catch (e) {
      debugPrint("Error getAllSharedAlbum  ${e.toString()}");
      return null;
    }
  }

  Future<Album?> createAlbum(
    String albumName,
    Iterable<Asset> assets, [
    Iterable<User> sharedUsers = const [],
  ]) async {
    try {
      final dto = await _apiService.albumApi.createAlbum(
        CreateAlbumDto(
          albumName: albumName,
          assetIds: assets.map((asset) => asset.remoteId!).toList(),
          sharedWithUserIds: sharedUsers.map((e) => e.id).toList(),
        ),
      );
      return dto != null ? Album.remote(dto) : null;
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
      return null;
    }
  }

  /*
   * Creates names like Untitled, Untitled (1), Untitled (2), ...
   */
  String _getNextAlbumName(List<Album>? albums) {
    const baseName = "Untitled";

    if (albums != null) {
      for (int round = 0; round < albums.length; round++) {
        final proposedName = "$baseName${round == 0 ? "" : " ($round)"}";

        if (albums.where((a) => a.name == proposedName).isEmpty) {
          return proposedName;
        }
      }
    }
    return baseName;
  }

  Future<Album?> createAlbumWithGeneratedName(
    Iterable<Asset> assets,
  ) async {
    return createAlbum(
      _getNextAlbumName(await getAlbums(isShared: false)),
      assets,
      [],
    );
  }

  Future<Album?> getAlbumDetail(String albumId) async {
    try {
      final dto = await _apiService.albumApi.getAlbumInfo(albumId);
      return dto != null ? Album.remote(dto) : null;
    } catch (e) {
      debugPrint('Error [getAlbumDetail] ${e.toString()}');
      return null;
    }
  }

  Future<AddAssetsResponseDto?> addAdditionalAssetToAlbum(
    Iterable<Asset> assets,
    Album album,
  ) async {
    try {
      var result = await _apiService.albumApi.addAssetsToAlbum(
        album.remoteId!,
        AddAssetsDto(assetIds: assets.map((asset) => asset.remoteId!).toList()),
      );
      return result;
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
      return null;
    }
  }

  Future<bool> addAdditionalUserToAlbum(
    List<String> sharedUserIds,
    Album album,
  ) async {
    try {
      var result = await _apiService.albumApi.addUsersToAlbum(
        album.remoteId!,
        AddUsersDto(sharedUserIds: sharedUserIds),
      );

      return result != null;
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> deleteAlbum(Album album) async {
    try {
      await _apiService.albumApi.deleteAlbum(album.remoteId!);
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> leaveAlbum(Album album) async {
    try {
      await _apiService.albumApi.removeUserFromAlbum(album.remoteId!, "me");
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    Album album,
    Iterable<Asset> assets,
  ) async {
    try {
      await _apiService.albumApi.removeAssetFromAlbum(
        album.remoteId!,
        RemoveAssetsDto(
          assetIds: assets.map((e) => e.remoteId!).toList(growable: false),
        ),
      );

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> changeTitleAlbum(
    Album album,
    String newAlbumTitle,
  ) async {
    try {
      await _apiService.albumApi.updateAlbumInfo(
        album.remoteId!,
        UpdateAlbumDto(
          albumName: newAlbumTitle,
        ),
      );
      album.name = newAlbumTitle;

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }
}
