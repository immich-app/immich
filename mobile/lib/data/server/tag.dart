import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:openapi/api.dart';

class TagApiRepository extends ApiRepository {
  final TagsApi _api;

  const TagApiRepository(this._api);

  /// Apply every tag in [tagIds] to every asset in [assetIds], returning the number of assets successfully tagged
  Future<int> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    final response = await _api.bulkTagAssets(TagBulkAssetsDto(assetIds: assetIds, tagIds: tagIds));
    return response?.count ?? 0;
  }

  /// Retrieves all known tags
  Future<List<Tag>> getAll() async {
    final response = await checkNull(_api.getAllTags());
    return response.map(_toTag).toList();
  }

  /// Create the tags named [values], returning the list of successfully created (or pre-existing) tags
  Future<List<Tag>> upsert(List<String> tags) async {
    final response = await checkNull(_api.upsertTags(TagUpsertDto(tags: tags)));
    return response.map(_toTag).toList();
  }

  static Tag _toTag(TagResponseDto dto) => .new(id: dto.id, value: dto.value);
}
