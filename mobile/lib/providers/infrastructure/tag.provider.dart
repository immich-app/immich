import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/infrastructure/repositories/tags_api.repository.dart';
import 'package:immich_mobile/providers/asset_tags.provider.dart';

final tagProvider = AsyncNotifierProvider<TagNotifier, Set<Tag>>(TagNotifier.new);

class TagNotifier extends AsyncNotifier<Set<Tag>> {
  @override
  Future<Set<Tag>> build() async {
    final repo = ref.read(tagsApiRepositoryProvider);
    final allTags = await repo.getAllTags();
    if (allTags == null) {
      return {};
    }
    return allTags.map((t) => Tag.fromDto(t)).toSet();
  }

  Future<void> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    final repo = ref.read(tagsApiRepositoryProvider);
    await repo.bulkTagAssets(assetIds, tagIds);

    for (final assetId in assetIds) {
      ref.invalidate(assetTagsProvider(assetId));
    }
  }

  Future<List<Tag>> upsertTags(List<String> tags) async {
    final repo = ref.read(tagsApiRepositoryProvider);
    final dtos = await repo.upsertTags(tags);
    if (dtos == null) {
      return [];
    }
    final upsertedTags = dtos.map((t) => Tag.fromDto(t)).toList();

    state = AsyncValue.data({...?state.valueOrNull, ...upsertedTags});
    return upsertedTags;
  }

  Iterable<Tag> getTags(Set<String> ids) {
    return state.requireValue.where((t) => ids.contains(t.id));
  }
}
