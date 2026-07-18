import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' hide AssetVisibility;
import 'package:immich_mobile/infrastructure/repositories/api.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:openapi/api.dart';

class SearchApiRepository extends ApiRepository {
  final SearchApi _api;

  const SearchApiRepository(this._api);

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
          query: filter.context == null ? const Optional.absent() : Optional.present(filter.context!),
          queryAssetId: filter.assetId == null ? const Optional.absent() : Optional.present(filter.assetId!),
          language: filter.language == null ? const Optional.absent() : Optional.present(filter.language!),
          country: filter.location.country == null
              ? const Optional.absent()
              : Optional.present(filter.location.country!),
          state: filter.location.state == null ? const Optional.absent() : Optional.present(filter.location.state!),
          city: filter.location.city == null ? const Optional.absent() : Optional.present(filter.location.city!),
          make: filter.camera.make == null ? const Optional.absent() : Optional.present(filter.camera.make!),
          model: filter.camera.model == null ? const Optional.absent() : Optional.present(filter.camera.model!),
          takenAfter: filter.date.takenAfter == null
              ? const Optional.absent()
              : Optional.present(filter.date.takenAfter!),
          takenBefore: filter.date.takenBefore == null
              ? const Optional.absent()
              : Optional.present(filter.date.takenBefore!),
          visibility: Optional.present(filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline),
          rating: filter.rating.rating.toOptional(),
          isFavorite: filter.display.isFavorite ? const Optional.present(true) : const Optional.absent(),
          isNotInAlbum: filter.display.isNotInAlbum ? const Optional.present(true) : const Optional.absent(),
          personIds: Optional.present(filter.people.map((e) => e.id).toList()),
          personMatchMode: _personMatchMode(filter),
          tagIds: filter.tagIds == null ? const Optional.absent() : Optional.present(filter.tagIds!),
          type: type == null ? const Optional.absent() : Optional.present(type),
          page: Optional.present(page),
          size: const Optional.present(100),
        ),
      );
    }

    return _api.searchAssets(
      MetadataSearchDto(
        originalFileName: filter.filename != null && filter.filename!.isNotEmpty
            ? Optional.present(filter.filename!)
            : const Optional.absent(),
        country: filter.location.country == null ? const Optional.absent() : Optional.present(filter.location.country!),
        description: filter.description != null && filter.description!.isNotEmpty
            ? Optional.present(filter.description!)
            : const Optional.absent(),
        ocr: filter.ocr != null && filter.ocr!.isNotEmpty ? Optional.present(filter.ocr!) : const Optional.absent(),
        state: filter.location.state == null ? const Optional.absent() : Optional.present(filter.location.state!),
        city: filter.location.city == null ? const Optional.absent() : Optional.present(filter.location.city!),
        make: filter.camera.make == null ? const Optional.absent() : Optional.present(filter.camera.make!),
        model: filter.camera.model == null ? const Optional.absent() : Optional.present(filter.camera.model!),
        takenAfter: filter.date.takenAfter == null
            ? const Optional.absent()
            : Optional.present(filter.date.takenAfter!),
        takenBefore: filter.date.takenBefore == null
            ? const Optional.absent()
            : Optional.present(filter.date.takenBefore!),
        visibility: Optional.present(filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline),
        rating: filter.rating.rating.toOptional(),
        isFavorite: filter.display.isFavorite ? const Optional.present(true) : const Optional.absent(),
        isNotInAlbum: filter.display.isNotInAlbum ? const Optional.present(true) : const Optional.absent(),
        personIds: Optional.present(filter.people.map((e) => e.id).toList()),
        personMatchMode: _personMatchMode(filter),
        tagIds: filter.tagIds == null ? const Optional.absent() : Optional.present(filter.tagIds!),
        type: type == null ? const Optional.absent() : Optional.present(type),
        page: Optional.present(page),
        size: const Optional.present(1000),
      ),
    );
  }

  /// Only send OR mode when multiple people are selected; server defaults to AND.
  Optional<PersonMatchMode?> _personMatchMode(SearchFilter filter) {
    if (filter.people.length > 1 && filter.personMatchMode == SearchPersonMatchMode.any) {
      return const Optional.present(PersonMatchMode.any);
    }
    return const Optional.absent();
  }

  Future<List<String>?> getSearchSuggestions(
    SearchSuggestionType type, {
    String? country,
    String? state,
    String? make,
    String? model,
  }) => _api.getSearchSuggestions(type, country: country, state: state, make: make, model: model);
}
