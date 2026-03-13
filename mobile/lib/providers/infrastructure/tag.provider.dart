import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';

class TagNotifier extends AsyncNotifier<Set<Tag>> {
  late final TagService service;

  @override
  Future<Set<Tag>> build() async {
    final service = ref.watch(tagServiceProvider);
    return await service.getAllTags();
  }

  Future<void> bulkTagAssets(List<String> assetIds, List<String> tagIds) async {
    await service.bulkTagAssets(assetIds, tagIds);
  }

  Future<List<Tag>> upsertTags(List<String> tags) async {
    final upsertedTags = await service.upsertTags(tags);

    state = AsyncValue.data({...?state.valueOrNull, ...upsertedTags});
    return upsertedTags;
  }
}

final tagProvider = AsyncNotifierProvider<TagNotifier, Set<Tag>>(TagNotifier.new);
