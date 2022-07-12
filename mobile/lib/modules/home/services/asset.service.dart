import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/models/delete_asset_response.model.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:openapi/api.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(networkServiceProvider),
    ref.watch(apiServiceProvider),
  ),
);

class AssetService {
  final NetworkService _networkService;
  final ApiService _apiService;

  AssetService(this._networkService, this._apiService);

  Future<List<AssetResponseDto>?> getAllAsset() async {
    try {
      return await _apiService.assetApi.getAllAssets();
    } catch (e) {
      debugPrint("Error [getAllAsset]  ${e.toString()}");
      return null;
    }
  }

  Future<AssetResponseDto?> getAssetById(String assetId) async {
    try {
      return await _apiService.assetApi.getAssetById(assetId);
    } catch (e) {
      debugPrint("Error [getAssetById]  ${e.toString()}");
      return null;
    }
  }

  Future<List<DeleteAssetResponse>?> deleteAssets(
    Set<AssetResponseDto> deleteAssets,
  ) async {
    try {
      var payload = [];

      for (var asset in deleteAssets) {
        payload.add(asset.id);
      }

      var res = await _networkService
          .deleteRequest(url: "asset/", data: {"ids": payload});

      List<dynamic> decodedData = jsonDecode(res.toString());

      List<DeleteAssetResponse> result =
          List.from(decodedData.map((a) => DeleteAssetResponse.fromMap(a)));

      return result;
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
      return null;
    }
  }
}
