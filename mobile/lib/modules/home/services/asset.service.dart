import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/models/immich_asset_with_exif.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

class AssetService {
  final NetworkService _networkService = NetworkService();

  Future<GetAllAssetResponse?> getAllAsset() async {
    var res = await _networkService.getRequest(url: "asset/all");
    try {
      Map<String, dynamic> decodedData = jsonDecode(res.toString());

      GetAllAssetResponse result = GetAllAssetResponse.fromMap(decodedData);
      return result;
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
    }
    return null;
  }

  Future<GetAllAssetResponse?> getOlderAsset(String? nextPageKey) async {
    try {
      var res = await _networkService.getRequest(
        url: "asset/all?nextPageKey=$nextPageKey",
      );

      Map<String, dynamic> decodedData = jsonDecode(res.toString());

      GetAllAssetResponse result = GetAllAssetResponse.fromMap(decodedData);
      if (result.count != 0) {
        return result;
      }
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
    }
    return null;
  }

  Future<List<ImmichAsset>> getNewAsset(String latestDate) async {
    try {
      var res = await _networkService.getRequest(
        url: "asset/new?latestDate=$latestDate",
      );

      List<dynamic> decodedData = jsonDecode(res.toString());

      List<ImmichAsset> result = List.from(decodedData.map((a) => ImmichAsset.fromMap(a)));
      if (result.isNotEmpty) {
        return result;
      }

      return [];
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
      return [];
    }
  }

  Future<ImmichAssetWithExif?> getAssetById(String assetId) async {
    try {
      var res = await _networkService.getRequest(
        url: "asset/assetById/$assetId",
      );

      Map<String, dynamic> decodedData = jsonDecode(res.toString());

      ImmichAssetWithExif result = ImmichAssetWithExif.fromMap(decodedData);
      print("result $result");
      return result;
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
      return null;
    }
  }
}
