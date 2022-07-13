import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(apiServiceProvider),
  ),
);

class AssetService {
  final ApiService _apiService;

  AssetService(this._apiService);

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

  Future<List<DeleteAssetResponseDto>?> deleteAssets(
    Set<AssetResponseDto> deleteAssets,
  ) async {
    try {
      List<String> payload = [];

      for (var asset in deleteAssets) {
        payload.add(asset.id);
      }

      return await _apiService.assetApi
          .deleteAsset(DeleteAssetDto(ids: payload));
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
      return null;
    }
  }
}
