import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' hide AssetVisibility;
import 'package:immich_mobile/domain/models/server_capability.model.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:openapi/api.dart' hide SearchFilter;
import 'package:openapi/api.dart' as api show SearchFilter;

class SearchApiRepository extends ApiRepository {
  final SearchApi _api;

  const SearchApiRepository(this._api);

  /// [cursor] is the `nextCursor` of the previous page, or null for the first page
  Future<({List<AssetResponseDto> items, String? nextCursor})?> search(
    SearchFilter filter,
    String? cursor,
    SemVer serverVersion,
  ) async {
    if (!serverVersion.supports(.searchFilterV1)) {
      final response = await _searchLegacy(filter, cursor == null ? 1 : int.parse(cursor));
      return response == null ? null : (items: response.assets.items, nextCursor: response.assets.nextPage);
    }

    final apiFilter = _toApiFilter(filter);
    final context = filter.context?.trim();
    final assetId = filter.assetId;

    // the generated list fields default to [], which the server rejects next to a filter
    final response = (context != null && context.isNotEmpty) || (assetId != null && assetId.isNotEmpty)
        ? await _api.searchSmart(
            SmartSearchDto(
              query: context == null || context.isEmpty ? const Optional.absent() : Optional.present(context),
              queryAssetId: assetId == null || assetId.isEmpty ? const Optional.absent() : Optional.present(assetId),
              language: filter.language == null ? const Optional.absent() : Optional.present(filter.language),
              filter: Optional.present(apiFilter),
              cursor: cursor == null ? const Optional.absent() : Optional.present(cursor),
              size: const Optional.present(100),
              albumIds: const Optional.absent(),
              personIds: const Optional.absent(),
              tagIds: const Optional.absent(),
            ),
          )
        : await _api.searchAssets(
            MetadataSearchDto(
              filter: Optional.present(apiFilter),
              cursor: cursor == null ? const Optional.absent() : Optional.present(cursor),
              size: const Optional.present(1000),
              albumIds: const Optional.absent(),
              personIds: const Optional.absent(),
              tagIds: const Optional.absent(),
            ),
          );

    return response == null ? null : (items: response.assets.items, nextCursor: response.assets.nextCursor);
  }

  api.SearchFilter _toApiFilter(SearchFilter filter) {
    final filename = filter.filename?.trim();
    final description = filter.description?.trim();
    final ocr = filter.ocr?.trim();
    final type = switch (filter.mediaType) {
      AssetType.image => AssetTypeEnum.IMAGE,
      AssetType.video => AssetTypeEnum.VIDEO,
      _ => null,
    };
    final tagIds = filter.tags?.map((tag) => tag.id).toList() ?? const [];
    final personIds = filter.people.map((person) => person.id).toList();
    final takenAfter = filter.date.takenAfter;
    final takenBefore = filter.date.takenBefore;

    return api.SearchFilter(
      originalFileName: filename == null || filename.isEmpty
          ? const Optional.absent()
          : Optional.present(_like(filename)),
      description: description == null || description.isEmpty
          ? const Optional.absent()
          : Optional.present(_like(description)),
      ocr: ocr == null || ocr.isEmpty
          ? const Optional.absent()
          : Optional.present(StringSimilarityFilter(matches: ocr)),
      country: _eq(filter.location.country),
      state: _eq(filter.location.state),
      city: _eq(filter.location.city),
      make: _eq(filter.camera.make),
      model: _eq(filter.camera.model),
      takenAt: takenAfter == null && takenBefore == null
          ? const Optional.absent()
          : Optional.present(
              DateFilter(
                gte: takenAfter == null ? const Optional.absent() : Optional.present(takenAfter),
                lte: takenBefore == null ? const Optional.absent() : Optional.present(takenBefore),
              ),
            ),
      visibility: Optional.present(
        EnumFilterAssetVisibility(
          eq: Optional.present(filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline),
          in_: const Optional.absent(),
          notIn: const Optional.absent(),
        ),
      ),
      trashedAt: Optional.present(DateFilterNullable(eq: const Optional.present(null))),
      isFavorite: filter.display.isFavorite ? Optional.present(BoolFilter(eq: true)) : const Optional.absent(),
      hasAlbums: filter.display.isNotInAlbum ? Optional.present(BoolFilter(eq: false)) : const Optional.absent(),
      personIds: personIds.isEmpty ? const Optional.absent() : Optional.present(_all(personIds)),
      tagIds: tagIds.isEmpty ? const Optional.absent() : Optional.present(_all(tagIds)),
      type: type == null
          ? const Optional.absent()
          : Optional.present(
              EnumFilterAssetType(
                eq: Optional.present(type),
                in_: const Optional.absent(),
                notIn: const Optional.absent(),
              ),
            ),
      rating: filter.rating.rating.toOptional().map(
        (rating) => NumberFilterNullable(
          eq: Optional.present(rating?.toDouble()),
          in_: const Optional.absent(),
          notIn: const Optional.absent(),
        ),
      ),
      or: const Optional.absent(),
    );
  }

  // the generated list fields default to [], which the server rejects for being empty
  Optional<StringFilterNullable?> _eq(String? value) => value == null
      ? const Optional.absent()
      : Optional.present(
          StringFilterNullable(
            eq: Optional.present(value),
            in_: const Optional.absent(),
            notIn: const Optional.absent(),
          ),
        );

  StringPatternFilter _like(String value) =>
      StringPatternFilter(like: Optional.present(value), in_: const Optional.absent(), notIn: const Optional.absent());

  IdsFilter _all(List<String> ids) =>
      IdsFilter(all: Optional.present(ids), any: const Optional.absent(), none: const Optional.absent());

  // TODO(v5): remove once 3.x servers are unsupported
  Future<SearchResponseDto?> _searchLegacy(SearchFilter filter, int page) {
    AssetTypeEnum? type;
    if (filter.mediaType.index == AssetType.image.index) {
      type = AssetTypeEnum.IMAGE;
    } else if (filter.mediaType.index == AssetType.video.index) {
      type = AssetTypeEnum.VIDEO;
    }

    final tagIds = filter.tags == null
        ? const Optional<List<String>>.absent()
        : Optional.present(filter.tags!.map((tag) => tag.id).toList());

    if ((filter.context != null && filter.context!.isNotEmpty) ||
        (filter.assetId != null && filter.assetId!.isNotEmpty)) {
      return _api.searchSmart(
        SmartSearchDto(
          query: filter.context == null ? const Optional.absent() : Optional.present(filter.context),
          queryAssetId: filter.assetId == null ? const Optional.absent() : Optional.present(filter.assetId),
          language: filter.language == null ? const Optional.absent() : Optional.present(filter.language),
          country: filter.location.country == null
              ? const Optional.absent()
              : Optional.present(filter.location.country),
          state: filter.location.state == null ? const Optional.absent() : Optional.present(filter.location.state),
          city: filter.location.city == null ? const Optional.absent() : Optional.present(filter.location.city),
          make: filter.camera.make == null ? const Optional.absent() : Optional.present(filter.camera.make),
          model: filter.camera.model == null ? const Optional.absent() : Optional.present(filter.camera.model),
          takenAfter: filter.date.takenAfter == null
              ? const Optional.absent()
              : Optional.present(filter.date.takenAfter),
          takenBefore: filter.date.takenBefore == null
              ? const Optional.absent()
              : Optional.present(filter.date.takenBefore),
          visibility: Optional.present(filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline),
          rating: filter.rating.rating.toOptional(),
          isFavorite: filter.display.isFavorite ? const Optional.present(true) : const Optional.absent(),
          isNotInAlbum: filter.display.isNotInAlbum ? const Optional.present(true) : const Optional.absent(),
          personIds: Optional.present(filter.people.map((e) => e.id).toList()),
          tagIds: tagIds,
          type: type == null ? const Optional.absent() : Optional.present(type),
          page: Optional.present(page),
          size: const Optional.present(100),
        ),
      );
    }

    return _api.searchAssets(
      MetadataSearchDto(
        originalFileName: filter.filename != null && filter.filename!.isNotEmpty
            ? Optional.present(filter.filename)
            : const Optional.absent(),
        country: filter.location.country == null ? const Optional.absent() : Optional.present(filter.location.country),
        description: filter.description != null && filter.description!.isNotEmpty
            ? Optional.present(filter.description)
            : const Optional.absent(),
        ocr: filter.ocr != null && filter.ocr!.isNotEmpty ? Optional.present(filter.ocr) : const Optional.absent(),
        state: filter.location.state == null ? const Optional.absent() : Optional.present(filter.location.state),
        city: filter.location.city == null ? const Optional.absent() : Optional.present(filter.location.city),
        make: filter.camera.make == null ? const Optional.absent() : Optional.present(filter.camera.make),
        model: filter.camera.model == null ? const Optional.absent() : Optional.present(filter.camera.model),
        takenAfter: filter.date.takenAfter == null ? const Optional.absent() : Optional.present(filter.date.takenAfter),
        takenBefore: filter.date.takenBefore == null
            ? const Optional.absent()
            : Optional.present(filter.date.takenBefore),
        visibility: Optional.present(filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline),
        rating: filter.rating.rating.toOptional(),
        isFavorite: filter.display.isFavorite ? const Optional.present(true) : const Optional.absent(),
        isNotInAlbum: filter.display.isNotInAlbum ? const Optional.present(true) : const Optional.absent(),
        personIds: Optional.present(filter.people.map((e) => e.id).toList()),
        tagIds: tagIds,
        type: type == null ? const Optional.absent() : Optional.present(type),
        page: Optional.present(page),
        size: const Optional.present(1000),
      ),
    );
  }

  Future<List<String>?> getSearchSuggestions(
    SearchSuggestionType type, {
    String? country,
    String? state,
    String? make,
    String? model,
  }) => _api.getSearchSuggestions(type, country: country, state: state, make: make, model: model);
}
