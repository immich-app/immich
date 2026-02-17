import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/infrastructure/repositories/tags_api.repository.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:openapi/api.dart';

final assetTagsProvider = AsyncNotifierProviderFamily(AssetTagsNotifier.new);

class AssetTagsNotifier extends FamilyAsyncNotifier<List<Tag>, String> {
  @override
  Future<List<Tag>> build(String remoteId) async {
    final tags = await ref.read(assetServiceProvider).getRemoteTagsOfAsset(remoteId);
    if (tags == null) {
      return [];
    }

    tags.sort(_sortTags);
    return tags;
  }

  Future<void> addTags(List<String> tagIds) async {
    await ref.read(tagsApiRepositoryProvider).bulkTagAssets([arg], tagIds);
    // state = AsyncData(await build(remoteId));
    ref.invalidateSelf();
  }

  Future<void> deleteTags(List<String> tagIds) async {
    final repo = ref.read(tagsApiRepositoryProvider);
    final List<Future<dynamic>> futures = [];
    for (final tagId in tagIds) {
      futures.add(repo.untagAssets(tagId, BulkIdsDto(ids: [arg])));
    }
    await Future.wait(futures);

    state = AsyncData(state.requireValue.where((t) => !tagIds.contains(t.id)).toList());
  }
}

int _sortTags(Tag a, Tag b) {
  final aNotEmpty = a.value.isNotEmpty;
  final bNotEmpty = b.value.isNotEmpty;
  if (aNotEmpty && !bNotEmpty) {
    return -1;
  } else if (!aNotEmpty && bNotEmpty) {
    return 1;
  } else if (!aNotEmpty && !bNotEmpty) {
    return 0;
  }

  return a.value.compareTo(b.value);
}
