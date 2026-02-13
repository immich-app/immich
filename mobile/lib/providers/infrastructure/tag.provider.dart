import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';

class TagNotifier extends AsyncNotifier<List<Tag>> {
  @override
  Future<List<Tag>> build() async {
    final api = ref.read(apiServiceProvider).tagsApi;
    final allTags = await api.getAllTags();
    if (allTags == null) {
      return [];
    }
    return allTags.map((t) => Tag.fromDto(t)).toList();
  }
}

final tagServiceProvider = AsyncNotifierProvider<TagNotifier, List<Tag>>(TagNotifier.new);