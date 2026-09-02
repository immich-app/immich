import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

final tagsApiRepositoryProvider = Provider<TagsApiRepository>(
  (ref) => TagsApiRepository(ref.read(apiServiceProvider).tagsApi),
);

class TagsApiRepository extends ApiRepository {
  final TagsApi _api;
  const TagsApiRepository(this._api);

  Future<List<TagResponseDto>?> getAllTags() async {
    return await _api.getAllTags();
  }

  Future<int> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    final response = await _api.bulkTagAssets(TagBulkAssetsDto(assetIds: assetIds, tagIds: tagIds));
    return response?.count ?? 0;
  }

  Future<List<TagResponseDto>?> upsertTags(List<String> tags) async {
    return _api.upsertTags(TagUpsertDto(tags: tags));
  }

  Future<TagResponseDto?> updateTag(String id, {String? name, String? color}) async {
    return _api.updateTag(
      id,
      TagUpdateDto(
        name: name == null ? const Optional.absent() : Optional.present(name),
        color: Optional.present(color),
      ),
    );
  }

  Future<void> deleteTag(String id) async {
    return _api.deleteTag(id);
  }

  Future<int> untagAssets(String tagId, List<String> assetIds) async {
    final response = await _api.untagAssets(tagId, BulkIdsDto(ids: assetIds));
    return response?.where((r) => r.success).length ?? 0;
  }
}
