import 'package:immich_mobile/domain/models/search_result.model.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/search_api.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' hide AssetVisibility;

class SearchService {
  final _log = Logger("SearchService");
  final SearchApiRepository _searchApiRepository;

  SearchService(this._searchApiRepository);

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
      _log.warning("Failed to get search suggestions", e);
    }
    return [];
  }

  Future<SearchResult?> search(SearchFilter filter, int page) async {
    try {
      final response = await _searchApiRepository.search(filter, page);

      if (response == null || response.assets.items.isEmpty) {
        return null;
      }

      return SearchResult(
        assets: response.assets.items.map((e) => e.toDto()).toList(),
        nextPage: response.assets.nextPage?.toInt(),
      );
    } catch (error, stackTrace) {
      _log.severe("Failed to search for assets", error, stackTrace);
    }
    return null;
  }
}
