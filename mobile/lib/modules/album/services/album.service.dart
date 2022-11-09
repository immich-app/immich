import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
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

  Future<List<AlbumResponseDto>?> getAlbums({required bool isShared}) async {
    try {
      return await _apiService.albumApi
          .getAllAlbums(shared: isShared ? isShared : null);
    } catch (e) {
      debugPrint("Error getAllSharedAlbum  ${e.toString()}");
      return null;
    }
  }

  Future<AlbumResponseDto?> createAlbum(
    String albumName,
    Iterable<Asset> assets,
    List<String> sharedUserIds,
  ) async {
    try {
      return await _apiService.albumApi.createAlbum(
        CreateAlbumDto(
          albumName: albumName,
          assetIds: assets.map((asset) => asset.id).toList(),
          sharedWithUserIds: sharedUserIds,
        ),
      );
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
      return null;
    }
  }

  /*
   * Creates names like Untitled, Untitled (1), Untitled (2), ...
   */
  String _getNextAlbumName(List<AlbumResponseDto>? albums) {
    const baseName = "Untitled";

    if (albums != null) {
      for (int round = 0; round < albums.length; round++) {
        final proposedName = "$baseName${round == 0 ? "" : " ($round)"}";

        if (albums.where((a) => a.albumName == proposedName).isEmpty) {
          return proposedName;
        }
      }
    }
    return baseName;
  }

  Future<AlbumResponseDto?> createAlbumWithGeneratedName(
    Iterable<Asset> assets,
  ) async {
    return createAlbum(
        _getNextAlbumName(await getAlbums(isShared: false)), assets, []);
  }

  Future<AlbumResponseDto?> getAlbumDetail(String albumId) async {
    try {
      return await _apiService.albumApi.getAlbumInfo(albumId);
    } catch (e) {
      debugPrint('Error [getAlbumDetail] ${e.toString()}');
      return null;
    }
  }

  Future<AddAssetsResponseDto?> addAdditionalAssetToAlbum(
    Iterable<Asset> assets,
    String albumId,
  ) async {
    try {
      var result = await _apiService.albumApi.addAssetsToAlbum(
        albumId,
        AddAssetsDto(assetIds: assets.map((asset) => asset.id).toList()),
      );
      return result;
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
      return null;
    }
  }

  Future<bool> addAdditionalUserToAlbum(
    List<String> sharedUserIds,
    String albumId,
  ) async {
    try {
      var result = await _apiService.albumApi.addUsersToAlbum(
        albumId,
        AddUsersDto(sharedUserIds: sharedUserIds),
      );

      return result != null;
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> deleteAlbum(String albumId) async {
    try {
      await _apiService.albumApi.deleteAlbum(albumId);
      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> leaveAlbum(String albumId) async {
    try {
      await _apiService.albumApi.removeUserFromAlbum(albumId, "me");

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    String albumId,
    List<String> assetIds,
  ) async {
    try {
      await _apiService.albumApi.removeAssetFromAlbum(
        albumId,
        RemoveAssetsDto(assetIds: assetIds),
      );

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> changeTitleAlbum(
    String albumId,
    String ownerId,
    String newAlbumTitle,
  ) async {
    try {
      await _apiService.albumApi.updateAlbumInfo(
        albumId,
        UpdateAlbumDto(
          albumName: newAlbumTitle,
        ),
      );

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }
}
