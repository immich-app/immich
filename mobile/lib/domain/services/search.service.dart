import 'package:immich_mobile/domain/models/search_result.model.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/search_api.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:logging/logging.dart';

class SearchService {
  final _log = Logger("SearchService");
  final SearchApiRepository _searchApiRepository;

  SearchService(this._searchApiRepository);

  Future<SearchResult?> search(SearchFilter filter, String? cursor, SemVer serverVersion) async {
    try {
      final response = await _searchApiRepository.search(filter, cursor, serverVersion);

      if (response == null || response.items.isEmpty) {
        return null;
      }

      return SearchResult(assets: response.items.map((e) => e.toDto()).toList(), nextCursor: response.nextCursor);
    } catch (error, stackTrace) {
      _log.severe("Failed to search for assets", error, stackTrace);
    }
    return null;
  }
}
