import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

class SharedAlbumService {
  final NetworkService _networkService = NetworkService();

  Future<List<SharedAlbum>> getAllSharedAlbum() async {
    try {
      var res = await _networkService.getRequest(url: 'shared/allSharedAlbums');
      List<dynamic> decodedData = jsonDecode(res.toString());
      List<SharedAlbum> result = List.from(decodedData.map((e) => SharedAlbum.fromMap(e)));

      return result;
    } catch (e) {
      debugPrint("Error getAllSharedAlbum  ${e.toString()}");
    }

    return [];
  }

  Future<bool> createSharedAlbum(String albumName, Set<ImmichAsset> assets, List<String> sharedUserIds) async {
    try {
      var res = await _networkService.postRequest(url: 'shared/createAlbum', data: {
        "albumName": albumName,
        "sharedWithUserIds": sharedUserIds,
        "assetIds": assets.map((asset) => asset.id).toList(),
      });

      if (res == null) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<SharedAlbum> getAlbumDetail(String albumId) async {
    try {
      var res = await _networkService.getRequest(url: 'shared/$albumId');
      dynamic decodedData = jsonDecode(res.toString());
      SharedAlbum result = SharedAlbum.fromMap(decodedData);

      return result;
    } catch (e) {
      throw Exception('Error getAllSharedAlbum  ${e.toString()}');
    }
  }

  Future<bool> addAdditionalAssetToAlbum(Set<ImmichAsset> assets, String albumId) async {
    try {
      var res = await _networkService.postRequest(url: 'shared/addAssets', data: {
        "albumId": albumId,
        "assetIds": assets.map((asset) => asset.id).toList(),
      });

      if (res == null) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error addAdditionalAssetToAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> addAdditionalUserToAlbum(List<String> sharedUserIds, String albumId) async {
    try {
      var res = await _networkService.postRequest(url: 'shared/addUsers', data: {
        "albumId": albumId,
        "sharedUserIds": sharedUserIds,
      });

      if (res == null) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error addAdditionalUserToAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> deleteAlbum(String albumId) async {
    try {
      Response res = await _networkService.deleteRequest(url: 'shared/$albumId');

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
      Response res = await _networkService.deleteRequest(url: 'shared/leaveAlbum/$albumId');

      if (res.statusCode != 200) {
        return false;
      }

      return true;
    } catch (e) {
      debugPrint("Error deleteAlbum  ${e.toString()}");
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(String albumId, List<String> assetIds) async {
    try {
      Response res = await _networkService.deleteRequest(url: 'shared/removeAssets/', data: {
        "albumId": albumId,
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

  Future<bool> changeTitleAlbum(String albumId, String ownerId, String newAlbumTitle) async {
    try {
      Response res = await _networkService.patchRequest(url: 'shared/updateInfo', data: {
        "albumId": albumId,
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
