// ignore_for_file: use-ref-and-state-synchronously

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/providers/user.provider.dart';

class TagNotifier extends AsyncNotifier<Set<Tag>> {
  @override
  Future<Set<Tag>> build() async {
    return ref.watch(tagServiceProvider).getAllTags();
  }

  Future<int> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    return ref.read(tagServiceProvider).bulkTagAssets(assetIds, tagIds);
  }

  Future<List<Tag>> upsertTags(List<String> tags) async {
    final ownerId = ref.read(currentUserProvider)?.id;
    final upsertedTags = await ref.read(tagServiceProvider).upsertTags(tags, ownerId: ownerId);

    state = AsyncValue.data({...?state.valueOrNull, ...upsertedTags});
    return upsertedTags;
  }

  Future<Tag?> updateTag(String id, {String? name, String? color}) async {
    final updated = await ref.read(tagServiceProvider).updateTag(id, name: name, color: color);
    if (updated == null) {
      return null;
    }

    final current = state.valueOrNull ?? const <Tag>{};
    state = AsyncValue.data({
      for (final tag in current)
        if (tag.id == id) updated else tag,
    });
    return updated;
  }

  Future<void> deleteTag(String id) async {
    await ref.read(tagServiceProvider).deleteTag(id);

    final current = state.valueOrNull ?? const <Tag>{};
    state = AsyncValue.data({
      for (final tag in current)
        if (tag.id != id) tag,
    });
  }
}

final tagProvider = AsyncNotifierProvider<TagNotifier, Set<Tag>>(TagNotifier.new);

/// Reactive stream of all tags from the local database, so the tag tree stays
/// in sync with tags added, edited, deleted, or synced from the server.
final tagsTreeProvider = StreamProvider.autoDispose<List<Tag>>((ref) {
  return ref.watch(tagServiceProvider).watchAllTags();
});

final assetTagsProvider = FutureProvider.autoDispose.family<List<Tag>, String>((ref, assetId) {
  return ref.watch(tagServiceProvider).getTagsForAsset(assetId);
});
