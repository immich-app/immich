import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/api.repository.dart';
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

  Future<TagBulkAssetsResponseDto?> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    return await _api.bulkTagAssets(TagBulkAssetsDto(assetIds: assetIds, tagIds: tagIds));
  }

  Future<List<TagResponseDto>?> upsertTags(List<String> tags) async {
    return _api.upsertTags(TagUpsertDto(tags: tags));
  }

  Future<List<BulkIdResponseDto>?> untagAssets(String id, BulkIdsDto dto) async {
    return _api.untagAssets(id, dto);
  }
}
