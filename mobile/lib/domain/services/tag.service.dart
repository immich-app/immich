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
    return _apiRepository.bulkTagAssets(assetIds, tagIds);
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

  Future<List<Tag>> upsertTags(List<String> tags) async {
    final dtos = await _apiRepository.upsertTags(tags);
    if (dtos == null) {
      return [];
    }
    return dtos.map(Tag.fromDto).toList();
  }
}
