import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/search_api.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/models/search/search_result.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final searchServiceProvider = Provider(
  (ref) => SearchService(
    ref.watch(apiServiceProvider),
    ref.watch(assetRepositoryProvider),
    ref.watch(searchApiRepositoryProvider),
  ),
);

class SearchService {
  final ApiService _apiService;
  final AssetRepository _assetRepository;
  final SearchApiRepository _searchApiRepository;

  final _log = Logger("SearchService");
  SearchService(
    this._apiService,
    this._assetRepository,
    this._searchApiRepository,
  );

  Future<List<String>?> getSearchSuggestions(
    SearchSuggestionType type, {
    String? country,
    String? state,
    String? make,
    String? model,
  }) async {
    try {
      return await _searchApiRepository.getSearchSuggestions(
        type,
        country: country,
        state: state,
        make: make,
        model: model,
      );
    } catch (e) {
      debugPrint("[ERROR] [getSearchSuggestions] ${e.toString()}");
      return [];
    }
  }

  Future<SearchResult?> search(SearchFilter filter, int page) async {
    try {
      final response = await _searchApiRepository.search(filter, page);

      if (response == null || response.assets.items.isEmpty) {
        return null;
      }

      return SearchResult(
        assets: await _assetRepository.getAllByRemoteId(response.assets.items.map((e) => e.id)),
        nextPage: response.assets.nextPage?.toInt(),
      );
    } catch (error, stackTrace) {
      _log.severe("Failed to search for assets", error, stackTrace);
    }
    return null;
  }

  Future<List<SearchExploreResponseDto>?> getExploreData() async {
    try {
      return await _apiService.searchApi.getExploreData();
    } catch (error, stackTrace) {
      _log.severe("Failed to getExploreData", error, stackTrace);
    }
    return null;
  }

  Future<List<AssetResponseDto>?> getAllPlaces() async {
    try {
      return await _apiService.searchApi.getAssetsByCity();
    } catch (error, stackTrace) {
      _log.severe("Failed to getAllPlaces", error, stackTrace);
    }
    return null;
  }
}
