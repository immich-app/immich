import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/infrastructure/repositories/tag.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/tags_api.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final tagServiceProvider = Provider<TagService>(
  (ref) => TagService(ref.watch(tagsApiRepositoryProvider), ref.watch(driftProvider).tagRepository),
);

class TagService {
  final TagsApiRepository _apiRepository;
  final TagRepository _repository;

  const TagService(this._apiRepository, this._repository);

  Future<int> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    final count = await _apiRepository.bulkTagAssets(assetIds, tagIds);
    await _repository.addTagAssets(assetIds, tagIds);
    return count;
  }

  Future<Set<Tag>> getAllTags() async {
    final tags = await _repository.getAll();
    if (tags.isNotEmpty) {
      return tags.toSet();
    }

    // Servers without tag sync support never populate the local database
    final dtos = await _apiRepository.getAllTags();
    if (dtos == null) {
      return {};
    }
    return dtos.map(Tag.fromDto).toSet();
  }

  Future<List<Tag>> getTagsForAsset(String assetId) {
    return _repository.getForAsset(assetId);
  }

  Stream<List<Tag>> watchAllTags() {
    return _repository.watchAll();
  }

  Future<List<Tag>> upsertTags(List<String> tags, {String? ownerId}) async {
    final dtos = await _apiRepository.upsertTags(tags);
    if (dtos == null) {
      return [];
    }
    final result = dtos.map(Tag.fromDto).toList();
    if (ownerId != null) {
      await _repository.upsertTags(result, ownerId);
    }
    return result;
  }

  Future<Tag?> updateTag(String id, {String? name, String? color}) async {
    final dto = await _apiRepository.updateTag(id, name: name, color: color);
    if (dto == null) {
      return null;
    }
    final tag = Tag.fromDto(dto);
    await _repository.updateTag(id, value: tag.value, color: tag.color);
    return tag;
  }

  Future<void> deleteTag(String id) async {
    await _apiRepository.deleteTag(id);
    await _repository.deleteTag(id);
  }

  Future<int> untagAssets(String tagId, List<String> assetIds) async {
    final count = await _apiRepository.untagAssets(tagId, assetIds);
    await _repository.removeTagAssets(tagId, assetIds);
    return count;
  }
}
