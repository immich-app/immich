import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

final searchServiceProvider = Provider(
  (ref) => SearchService(
    ref.watch(apiServiceProvider),
  ),
);

class SearchService {
  final ApiService _apiService;

  SearchService(this._apiService);

  Future<List<String>?> getUserSuggestedSearchTerms() async {
    try {
      return await _apiService.assetApi.getAssetSearchTerms();
    } catch (e) {
      debugPrint("[ERROR] [getUserSuggestedSearchTerms] ${e.toString()}");
      return [];
    }
  }

  Future<List<Asset>?> searchAsset(String searchTerm) async {
    try {
      final List<AssetResponseDto>? results = await _apiService.assetApi
          .searchAsset(SearchAssetDto(searchTerm: searchTerm));
      if (results == null) {
        return null;
      }
      return results.map((e) => Asset.remote(e)).toList();
    } catch (e) {
      debugPrint("[ERROR] [searchAsset] ${e.toString()}");
      return null;
    }
  }

  Future<List<CuratedLocationsResponseDto>?> getCuratedLocation() async {
    try {
      var locations = await _apiService.assetApi.getCuratedLocations();

      return locations;
    } catch (e) {
      debugPrint("Error [getCuratedLocation] ${e.toString()}");
      return [];
    }
  }

  Future<List<CuratedObjectsResponseDto>?> getCuratedObjects() async {
    try {
      return await _apiService.assetApi.getCuratedObjects();
    } catch (e) {
      debugPrint("Error [getCuratedObjects] ${e.toString()}");
      return [];
    }
  }
}
