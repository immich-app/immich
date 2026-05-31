import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' hide AssetVisibility;
import 'package:immich_mobile/infrastructure/repositories/api.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:openapi/api.dart';

class SearchApiRepository extends ApiRepository {
  final SearchApi _api;

  const SearchApiRepository(this._api);

  Future<SearchResponseDto?> search(SearchFilter filter, int page) {
    AssetTypeEnum? type;
    if (filter.mediaType.index == AssetType.image.index) {
      type = AssetTypeEnum.image;
    } else if (filter.mediaType.index == AssetType.video.index) {
      type = AssetTypeEnum.video;
    }

    if ((filter.context != null && filter.context!.isNotEmpty) ||
        (filter.assetId != null && filter.assetId!.isNotEmpty)) {
      return _api.searchSmart(
        SmartSearchDto(
          query: filter.context.toOptional(),
          queryAssetId: filter.assetId.toOptional(),
          language: filter.language.toOptional(),
          country: filter.location.country.toOptional(),
          state: filter.location.state.toOptional(),
          city: filter.location.city.toOptional(),
          make: filter.camera.make.toOptional(),
          model: filter.camera.model.toOptional(),
          takenAfter: filter.date.takenAfter.toOptional(),
          takenBefore: filter.date.takenBefore.toOptional(),
          visibility: (filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline).toOptional(),
          rating: filter.rating.rating.toOptional(),
          isFavorite: (filter.display.isFavorite ? true : null).toOptional(),
          isNotInAlbum: (filter.display.isNotInAlbum ? true : null).toOptional(),
          personIds: filter.people.map((e) => e.id).toList().toOptional(),
          tagIds: filter.tagIds.toOptional(),
          type: type.toOptional(),
          page: page.toOptional(),
          size: 100.toOptional(),
        ),
      );
    }

    return _api.searchAssets(
      MetadataSearchDto(
        originalFileName: (filter.filename != null && filter.filename!.isNotEmpty ? filter.filename : null).toOptional(),
        country: filter.location.country.toOptional(),
        description: (filter.description != null && filter.description!.isNotEmpty ? filter.description : null)
            .toOptional(),
        ocr: (filter.ocr != null && filter.ocr!.isNotEmpty ? filter.ocr : null).toOptional(),
        state: filter.location.state.toOptional(),
        city: filter.location.city.toOptional(),
        make: filter.camera.make.toOptional(),
        model: filter.camera.model.toOptional(),
        takenAfter: filter.date.takenAfter.toOptional(),
        takenBefore: filter.date.takenBefore.toOptional(),
        visibility: (filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline).toOptional(),
        rating: filter.rating.rating.toOptional(),
        isFavorite: (filter.display.isFavorite ? true : null).toOptional(),
        isNotInAlbum: (filter.display.isNotInAlbum ? true : null).toOptional(),
        personIds: filter.people.map((e) => e.id).toList().toOptional(),
        tagIds: filter.tagIds.toOptional(),
        type: type.toOptional(),
        page: page.toOptional(),
        size: 1000.toOptional(),
      ),
    );
  }

  Future<List<String>?> getSearchSuggestions(
    SearchSuggestionType type, {
    String? country,
    String? state,
    String? make,
    String? model,
  }) => _api.getSearchSuggestions(type: type, country: country, state: state, make: make, model: model);
}
