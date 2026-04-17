import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/search_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final searchServiceProvider = Provider(
  (ref) => SearchService(ref.watch(apiServiceProvider), ref.watch(searchApiRepositoryProvider)),
);

class SearchService {
  final ApiService _apiService;
  final SearchApiRepository _searchApiRepository;

  final _log = Logger("SearchService");
  SearchService(this._apiService, this._searchApiRepository);

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
      dPrint(() => "[ERROR] [getSearchSuggestions] ${e.toString()}");
      return [];
    }
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
