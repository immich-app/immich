import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
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
  }

  Future<GetAllAssetResponse?> getMoreAsset(String? nextPageKey) async {
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
  }
}
