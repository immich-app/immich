import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';

class TagNotifier extends AsyncNotifier<Set<Tag>> {
  @override
  Future<Set<Tag>> build() async {
    return ref.watch(tagServiceProvider).getAllTags();
  }

  Future<int> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    return ref.read(tagServiceProvider).bulkTagAssets(assetIds, tagIds);
  }

  Future<List<Tag>> upsertTags(List<String> tags) async {
    final upsertedTags = await ref.read(tagServiceProvider).upsertTags(tags);

    state = AsyncValue.data({...?state.valueOrNull, ...upsertedTags});
    return upsertedTags;
  }
}

final tagProvider = AsyncNotifierProvider<TagNotifier, Set<Tag>>(TagNotifier.new);
