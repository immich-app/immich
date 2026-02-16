import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/infrastructure/repositories/tags_api.repository.dart';

class TagNotifier extends AsyncNotifier<Set<Tag>> {
  @override
  Future<Set<Tag>> build() async {
    final _api = ref.read(tagsApiRepositoryProvider);
    final allTags = await _api.getAllTags();
    if (allTags == null) {
      return {};
    }
    return allTags.map((t) => Tag.fromDto(t)).toSet();
  }
}

final tagProvider = AsyncNotifierProvider<TagNotifier, Set<Tag>>(TagNotifier.new);
