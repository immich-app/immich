import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';

final searchServiceProvider = Provider(
  (ref) => SearchService(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
  ),
);

class SearchService {
  final ApiService _apiService;
  final Isar _db;

  SearchService(this._apiService, this._db);

  Future<List<String>?> getUserSuggestedSearchTerms() async {
    try {
      return await _apiService.assetApi.getAssetSearchTerms();
    } catch (e) {
      debugPrint("[ERROR] [getUserSuggestedSearchTerms] ${e.toString()}");
      return [];
    }
  }

  Future<List<Asset>?> searchAsset(String searchTerm) async {
    // TODO search in local DB: 1. when offline, 2. to find local assets
    try {
      final SearchResponseDto? results = await _apiService.searchApi
          .search(query: searchTerm, clip: true);
      if (results == null) {
        return null;
      }
      // TODO local DB might be out of date; add assets not yet in DB?
      return _db.assets.getAllByRemoteId(results.assets.items.map((e) => e.id));
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
