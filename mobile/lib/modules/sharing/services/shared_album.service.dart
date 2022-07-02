import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

final sharedAlbumServiceProvider =
    Provider((ref) => SharedAlbumService(ref.watch(networkServiceProvider)));

class SharedAlbumService {
  final NetworkService _networkService;
  SharedAlbumService(this._networkService);

  Future<List<SharedAlbum>> getAllSharedAlbum() async {
    try {
      var res = await _networkService.getRequest(url: 'album?shared=true');
      List<dynamic> decodedData = jsonDecode(res.toString());
      List<SharedAlbum> result =
          List.from(decodedData.map((e) => SharedAlbum.fromMap(e)));

      return result;
    } catch (e) {
      debugPrint("Error getAllSharedAlbum  ${e.toString()}");
    }

    return [];
  }

  Future<bool> createSharedAlbum(String albumName, Set<ImmichAsset> assets,
      List<String> sharedUserIds) async {
    try {
      var res = await _networkService.postRequest(url: 'album', data: {
        "albumName": albumName,
        "sharedWithUserIds": sharedUserIds,
        "assetIds": assets.map((asset) => asset.id).toList(),
      });

      return res != null;
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<SharedAlbum> getAlbumDetail(String albumId) async {
    try {
      var res = await _networkService.getRequest(url: 'album/$albumId');
      dynamic decodedData = jsonDecode(res.toString());
      SharedAlbum result = SharedAlbum.fromMap(decodedData);

      return result;
    } catch (e) {
      throw Exception('Error getAllSharedAlbum  ${e.toString()}');
    }
  }

  Future<bool> addAdditionalAssetToAlbum(
      Set<ImmichAsset> assets, String albumId) async {
    try {
      var res =
          await _networkService.putRequest(url: 'album/$albumId/assets', data: {
        "albumId": albumId,
        "assetIds": assets.map((asset) => asset.id).toList(),
      });

      return res != null;
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> addAdditionalUserToAlbum(
      List<String> sharedUserIds, String albumId) async {
    try {
      var res =
          await _networkService.putRequest(url: 'album/$albumId/users', data: {
        "sharedUserIds": sharedUserIds,
      });

      return res != null;
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> deleteAlbum(String albumId) async {
    try {
      Response res = await _networkService.deleteRequest(url: 'album/$albumId');

      if (res.statusCode != 200) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> leaveAlbum(String albumId) async {
    try {
      Response res =
          await _networkService.deleteRequest(url: 'album/$albumId/user/me');

      if (res.statusCode != 200) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
      String albumId, List<String> assetIds) async {
    try {
      Response res = await _networkService
          .deleteRequest(url: 'album/$albumId/assets', data: {
        "assetIds": assetIds,
      });

      if (res.statusCode != 200) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> changeTitleAlbum(
      String albumId, String ownerId, String newAlbumTitle) async {
    try {
      Response res =
          await _networkService.patchRequest(url: 'album/$albumId/', data: {
        "ownerId": ownerId,
        "albumName": newAlbumTitle,
      });

      if (res.statusCode != 200) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }
}
