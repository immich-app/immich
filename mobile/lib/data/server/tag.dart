import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' show RemoteAsset;
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

final tagApiRepositoryProvider = Provider((ref) {
  final api = ref.watch(apiServiceProvider);
  return TagApiRepository(api.tagsApi, api.searchApi);
});

class TagApiRepository extends ApiRepository {
  final TagsApi _api;
  final SearchApi _search;

  const TagApiRepository(this._api, this._search);

  Future<Tag> create(String name, {required bool isPrivate, String? parentId}) async {
    final dto = TagCreateDto(name: name, isPrivate: Optional.present(isPrivate));
    if (parentId != null) {
      dto.parentId = Optional.present(parentId);
    }
    return tagFromDto(await checkNull(_api.createTag(dto)));
  }

  Future<Tag> update(Tag tag, {required String name, bool? isPrivate}) async {
    final dto = TagUpdateDto(name: Optional.present(name));
    if (isPrivate != null) {
      dto.isPrivate = Optional.present(isPrivate);
    }
    return tagFromDto(await checkNull(_api.updateTag(tag.id, dto)));
  }

  Future<void> delete(String id) => _api.deleteTag(id);

  Future<List<String>> addAssets(String id, List<String> assetIds) async {
    final result = await checkNull(_api.tagAssets(id, BulkIdsDto(ids: assetIds)));
    return [
      for (final item in result)
        if (item.success) item.id,
    ];
  }

  Future<({List<RemoteAsset> assets, String? nextCursor})> getAssets(
    String id, {
    String? cursor,
    required bool includeLocked,
    required bool trashed,
    List<String> excludedTagIds = const [],
    Future<void>? abortTrigger,
  }) async {
    final dto = MetadataSearchDto(
      filter: Optional.present(
        SearchFilter(
          trashedAt: Optional.present(
            trashed
                ? DateFilterNullable(ne: const Optional.present(null))
                : DateFilterNullable(eq: const Optional.present(null)),
          ),
          tagIds: Optional.present(IdsFilter(all: Optional.present([id]), none: Optional.present(excludedTagIds))),
          visibility: Optional.present(
            EnumFilterAssetVisibility(
              in_: Optional.present([
                AssetVisibility.timeline,
                AssetVisibility.archive,
                if (includeLocked) AssetVisibility.locked,
              ]),
            ),
          ),
        ),
      ),
      size: const Optional.present(200),
    );
    if (cursor != null) {
      dto.cursor = Optional.present(cursor);
    }
    final response = await checkNull(_search.searchAssets(dto, abortTrigger: abortTrigger));
    return (
      assets: response.assets.items.map((asset) => asset.toDto()).toList(),
      nextCursor: response.assets.nextCursor,
    );
  }

  /// Apply every tag in [tagIds] to every asset in [assetIds], returning the number of assets successfully tagged
  Future<int> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    final response = await _api.bulkTagAssets(TagBulkAssetsDto(assetIds: assetIds, tagIds: tagIds));
    return response?.count ?? 0;
  }

  /// Remove the tag [tagId] from every asset in [assetIds], returning the number of assets successfully untagged
  Future<int> untagAssets(String tagId, List<String> assetIds) async {
    final response = await _api.untagAssets(tagId, BulkIdsDto(ids: assetIds));
    return response?.where((result) => result.success).length ?? 0;
  }

  /// Retrieves all known tags
  Future<List<Tag>> getAll() async {
    final response = await checkNull(_api.getAllTags());
    return response.map(tagFromDto).toList();
  }

  /// Create the tags named [values], returning the list of successfully created (or pre-existing) tags
  Future<List<Tag>> upsert(List<String> tags) async {
    final response = await checkNull(_api.upsertTags(TagUpsertDto(tags: tags)));
    return response.map(tagFromDto).toList();
  }

  static Tag tagFromDto(TagResponseDto dto) => Tag(
    id: dto.id,
    value: dto.value,
    parentId: dto.parentId.orElse(null),
    color: dto.color.orElse(null),
    isPrivate: dto.isPrivate.orElse(false) ?? false,
  );
}
