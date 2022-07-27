import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

final sharedAlbumServiceProvider = Provider(
  (ref) => SharedAlbumService(
    ref.watch(apiServiceProvider),
  ),
);

class SharedAlbumService {
  final ApiService _apiService;
  SharedAlbumService(this._apiService);

  Future<List<AlbumResponseDto>?> getAllSharedAlbum() async {
    try {
      return await _apiService.albumApi.getAllAlbums(shared: true);
    } catch (e) {
      debugPrint("Error getAllSharedAlbum  ${e.toString()}");
      return null;
    }
  }

  Future<bool> createSharedAlbum(
    String albumName,
    Set<AssetResponseDto> assets,
    List<String> sharedUserIds,
  ) async {
    try {
      _apiService.albumApi.createAlbum(
        CreateAlbumDto(
          albumName: albumName,
          assetIds: assets.map((asset) => asset.id).toList(),
          sharedWithUserIds: sharedUserIds,
        ),
      );

      return true;
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<AlbumResponseDto?> getAlbumDetail(String albumId) async {
    try {
      return await _apiService.albumApi.getAlbumInfo(albumId);
    } catch (e) {
      debugPrint('Error [getAlbumDetail] ${e.toString()}');
      return null;
    }
  }

  Future<bool> addAdditionalAssetToAlbum(
    Set<AssetResponseDto> assets,
    String albumId,
  ) async {
    try {
      var result = await _apiService.albumApi.addAssetsToAlbum(
        albumId,
        AddAssetsDto(assetIds: assets.map((asset) => asset.id).toList()),
      );
      return result != null;
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
      return false;
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
