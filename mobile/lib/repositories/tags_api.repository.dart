import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/folder_api.interface.dart';
import 'package:immich_mobile/interfaces/tags_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final tagsApiRepositoryProvider = Provider(
  (ref) => TagsApiRepository(
    ref.watch(apiServiceProvider),
  ),
);

class TagsApiRepository extends ApiRepository implements ITagsApiRepository {
  final ApiService _api;
  final Logger _log = Logger("TagsApiRepository");

  TagsApiRepository(this._api);

  @override
  Future<List<TagResponseDto>> getAllUniqueTags() async {
    try {
      final list = await _api.tagsApi.getAllTags();
      return list ?? [];
    } catch (e, stack) {
      _log.severe("Failed to fetch unique original links", e, stack);
      return [];
    }
  }

  @override
  Future<List<Asset>> getAssetsForPath(String path) async {
    try {
      final list =
          await _api.searchApi.searchAssets(MetadataSearchDto(tagIds: [path]));
      return list != null ? list.assets.items.map(Asset.remote).toList() : [];
    } catch (e, stack) {
      _log.severe("Failed to fetch Assets by original path", e, stack);
      return [];
    }
  }
}
