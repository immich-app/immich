import 'dart:convert';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' hide AssetVisibility;
import 'package:immich_mobile/infrastructure/repositories/api.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

class SearchApiRepository extends ApiRepository {
  final ApiService _apiService;

  SearchApiRepository(this._apiService);

  SearchApi get _api => _apiService.searchApi;

  Future<SearchResponseDto?> search(SearchFilter filter, int page) {
    AssetTypeEnum? type;
    if (filter.mediaType.index == AssetType.image.index) {
      type = AssetTypeEnum.IMAGE;
    } else if (filter.mediaType.index == AssetType.video.index) {
      type = AssetTypeEnum.VIDEO;
    }

    if ((filter.context != null && filter.context!.isNotEmpty) ||
        (filter.assetId != null && filter.assetId!.isNotEmpty)) {
      return _api.searchSmart(
        SmartSearchDto(
          query: filter.context,
          queryAssetId: filter.assetId,
          language: filter.language,
          country: filter.location.country,
          state: filter.location.state,
          city: filter.location.city,
          make: filter.camera.make,
          model: filter.camera.model,
          takenAfter: filter.date.takenAfter,
          takenBefore: filter.date.takenBefore,
          visibility: filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline,
          rating: filter.rating.rating,
          isFavorite: filter.display.isFavorite ? true : null,
          isNotInAlbum: filter.display.isNotInAlbum ? true : null,
          personIds: filter.people.map((e) => e.id).toList(),
          tagIds: filter.tagIds,
          type: type,
          page: page,
          size: 100,
        ),
      );
    }

    return _api.searchAssets(
      MetadataSearchDto(
        originalFileName: filter.filename != null && filter.filename!.isNotEmpty ? filter.filename : null,
        country: filter.location.country,
        description: filter.description != null && filter.description!.isNotEmpty ? filter.description : null,
        ocr: filter.ocr != null && filter.ocr!.isNotEmpty ? filter.ocr : null,
        state: filter.location.state,
        city: filter.location.city,
        make: filter.camera.make,
        model: filter.camera.model,
        takenAfter: filter.date.takenAfter,
        takenBefore: filter.date.takenBefore,
        visibility: filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline,
        rating: filter.rating.rating,
        isFavorite: filter.display.isFavorite ? true : null,
        isNotInAlbum: filter.display.isNotInAlbum ? true : null,
        personIds: filter.people.map((e) => e.id).toList(),
        tagIds: filter.tagIds,
        type: type,
        page: page,
        size: 1000,
      ),
    );
  }

  Future<List<String>?> getSearchSuggestions(
    SearchSuggestionType type, {
    String? country,
    String? state,
    String? make,
    String? model,
  }) async {
    final response = await _api.getSearchSuggestionsWithHttpInfo(
      type,
      country: country,
      state: state,
      make: make,
      model: model,
    );

    if (response.body.isEmpty) {
      return const [];
    }

    return List<String>.from(jsonDecode(utf8.decode(response.bodyBytes)) as List);
  }
}
