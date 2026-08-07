import 'package:immich_mobile/domain/models/search_result.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/search_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' hide AssetVisibility;

class SearchService {
  final _log = Logger("SearchService");
  final SearchApiRepository _searchApiRepository;
  final DriftLocalAssetRepository _localAssetRepository;

  SearchService(this._searchApiRepository, this._localAssetRepository);

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
      if (filter.storage == SearchStorageStatus.notBackedUp) {
        final localAssets = await _localAssetRepository.searchDeviceOnlyAssets(filter, page);
        final nextPage = localAssets.length == DriftLocalAssetRepository.searchPageSize ? page + 1 : null;
        return SearchResult(assets: localAssets, nextPage: nextPage);
      }

      var currentPage = page;
      List<BaseAsset> accumulatedAssets = [];
      int? nextPage;
      int iterations = 0;

      while (true) {
        iterations++;
        final response = await _searchApiRepository.search(filter, currentPage);

        if (response == null || response.assets.items.isEmpty) {
          nextPage = null;
          break;
        }

        var assets = response.assets.items.map((e) => e.toDto()).toList();
        nextPage = response.assets.nextPage?.toInt();

        if (filter.storage == SearchStorageStatus.serverOnly) {
          final checksums = assets.map((a) => a.checksum).where((c) => c != null).cast<String>();
          final localChecksums = await _localAssetRepository.getExistingChecksums(checksums);
          assets = assets.where((a) => a.checksum == null || !localChecksums.contains(a.checksum)).toList();
        }

        accumulatedAssets.addAll(assets);

        // Break if we are not filtering, or if we have collected enough items, or if there are no more pages
        if (filter.storage != SearchStorageStatus.serverOnly || accumulatedAssets.length >= 20 || nextPage == null || iterations >= 3) {
          break;
        }

        currentPage = nextPage;
      }

      if (page == 1 && accumulatedAssets.isEmpty && nextPage == null) {
        return null;
      }

      return SearchResult(
        assets: accumulatedAssets,
        nextPage: nextPage,
      );
    } catch (error, stackTrace) {
      _log.severe("Failed to search for assets", error, stackTrace);
    }
    return null;
  }
}
