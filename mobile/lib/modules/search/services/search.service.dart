import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
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

  final _log = Logger("SearchService");
  SearchService(this._apiService, this._db);

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

  Future<List<Asset>?> search(SearchFilter filter, int page) async {
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
        response = await _apiService.searchApi.searchMetadata(
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

      return _db.assets
          .getAllByRemoteId(response.assets.items.map((e) => e.id));
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
