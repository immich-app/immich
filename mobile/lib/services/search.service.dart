import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/search/search_result.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final searchServiceProvider = Provider(
  (ref) => SearchService(
    ref.watch(apiServiceProvider),
    ref.watch(assetRepositoryProvider),
  ),
);

class SearchService {
  final ApiService _apiService;
  final IAssetRepository _assetRepository;

  final _log = Logger("SearchService");
  SearchService(this._apiService, this._assetRepository);

  Future<List<String>?> getSearchSuggestions(
    SearchSuggestionType type, {
    String? country,
    String? state,
    String? make,
    String? model,
  }) async {
    try {
      return await _apiService.searchApi.getSearchSuggestions(
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
      SearchResponseDto? response;
      AssetTypeEnum? type;
      if (filter.mediaType == AssetType.image) {
        type = AssetTypeEnum.IMAGE;
      } else if (filter.mediaType == AssetType.video) {
        type = AssetTypeEnum.VIDEO;
      }

      if (filter.context != null && filter.context!.isNotEmpty) {
        response = await _apiService.searchApi.searchSmart(
          SmartSearchDto(
            query: filter.context!,
            country: filter.location.country,
            state: filter.location.state,
            city: filter.location.city,
            make: filter.camera.make,
            model: filter.camera.model,
            takenAfter: filter.date.takenAfter,
            takenBefore: filter.date.takenBefore,
            isArchived: filter.display.isArchive,
            isFavorite: filter.display.isFavorite,
            isNotInAlbum: filter.display.isNotInAlbum,
            personIds: filter.people.map((e) => e.id).toList(),
            type: type,
            page: page,
            size: 1000,
          ),
        );
      } else {
        response = await _apiService.searchApi.searchAssets(
          MetadataSearchDto(
            originalFileName:
                filter.filename != null && filter.filename!.isNotEmpty
                    ? filter.filename
                    : null,
            country: filter.location.country,
            state: filter.location.state,
            city: filter.location.city,
            make: filter.camera.make,
            model: filter.camera.model,
            takenAfter: filter.date.takenAfter,
            takenBefore: filter.date.takenBefore,
            isArchived: filter.display.isArchive,
            isFavorite: filter.display.isFavorite,
            isNotInAlbum: filter.display.isNotInAlbum,
            personIds: filter.people.map((e) => e.id).toList(),
            type: type,
            page: page,
            size: 1000,
          ),
        );
      }

      if (response == null) {
        return null;
      }

      return SearchResult(
        assets: await _assetRepository.getAllByRemoteId(
          response.assets.items.map((e) => e.id),
        ),
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
