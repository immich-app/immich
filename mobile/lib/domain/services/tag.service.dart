import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/infrastructure/repositories/tags_api.repository.dart';

final tagServiceProvider = Provider<TagService>((ref) => TagService(ref.watch(tagsApiRepositoryProvider)));

class TagService {
  final TagsApiRepository _repository;

  const TagService(this._repository);

  Future<int> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    return _repository.bulkTagAssets(assetIds, tagIds);
  }

  Future<Set<Tag>> getAllTags() async {
    final dtos = await _repository.getAllTags();
    if (dtos == null) {
      return {};
    }
    return dtos.map((dto) => Tag.fromDto(dto)).toSet();
  }

  Future<List<Tag>> upsertTags(List<String> tags) async {
    final dtos = await _repository.upsertTags(tags);
    if (dtos == null) {
      return [];
    }
    return dtos.map((dto) => Tag.fromDto(dto)).toList();
  }
}
