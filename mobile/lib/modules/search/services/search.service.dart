import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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

  Future<List<AssetResponseDto>?> searchAsset(String searchTerm) async {
    try {
      return await _apiService.assetApi
          .searchAsset(SearchAssetDto(searchTerm: searchTerm));
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
      throw [];
    }
  }
}
