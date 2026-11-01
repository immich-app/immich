import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/tag.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';
import 'package:logging/logging.dart';

final _log = Logger("TagStore");

typedef TagAssetPage = ({List<RemoteAsset> assets, String? nextCursor});
typedef TagAssetQuery = ({String id, String? cursor, bool trashed});

/// User defined tags that can be applied to assets
///
extension type const TagStore._(Provider<TagMutations> _provider) implements Provider<TagMutations> {
  static final TagStore instance = TagStore._(Provider((ref) => TagMutations._(ref)));

  AutoDisposeFutureProvider<List<Tag>> all() => _allProvider;

  AutoDisposeFutureProvider<TagAssetPage> assets(TagAssetQuery query) => _assetsProvider(query);

  AutoDisposeFutureProviderFamily<List<Tag>, String> get forAsset => _forAssetProvider;
}

final _fetchedTagsProvider = FutureProvider.autoDispose<List<Tag>>((ref) async {
  ref.watch(privateContentVisibleProvider);
  try {
    return await ref.watch(tagApiRepositoryProvider).getAll();
  } catch (error, stack) {
    _log.severe("Failed to get all tags", error, stack);
    return const [];
  }
});

final _allProvider = FutureProvider.autoDispose<List<Tag>>((ref) async {
  final unlocked = ref.watch(privateContentVisibleProvider);
  final tags = await ref.watch(_fetchedTagsProvider.future);
  return unlocked ? tags : tags.visibleWhenLocked;
});

final _assetsProvider = FutureProvider.autoDispose.family<TagAssetPage, TagAssetQuery>((ref, query) async {
  final cancel = Completer<void>();
  ref.onDispose(cancel.complete);
  final repository = ref.watch(tagApiRepositoryProvider);
  final unlocked = ref.watch(privateContentVisibleProvider);
  final tags = await ref.watch(_fetchedTagsProvider.future);
  final tag = tags.where((tag) => tag.id == query.id).firstOrNull;
  final isPrivate = tag != null && tags.isEffectivelyPrivate(tag);
  if (tag == null || (isPrivate && !unlocked) || cancel.isCompleted) {
    return (assets: const <RemoteAsset>[], nextCursor: null);
  }
  return repository.getAssets(
    query.id,
    cursor: query.cursor,
    trashed: query.trashed,
    includeLocked: isPrivate,
    excludedTagIds: isPrivate
        ? const []
        : [
            for (final tag in tags)
              if (tag.isPrivate) tag.id,
          ],
    abortTrigger: cancel.future,
  );
});

final _forAssetProvider = FutureProvider.autoDispose.family<List<Tag>, String>((ref, assetId) async {
  final unlocked = ref.watch(privateContentVisibleProvider);
  final publicTags = unlocked ? null : ref.watch(_allProvider.future);
  final tags = await ref.watch(assetServiceProvider).getTags(assetId);
  if (publicTags == null) {
    return tags;
  }
  final publicIds = (await publicTags).map((tag) => tag.id).toSet();
  return tags.where((tag) => publicIds.contains(tag.id)).toList();
});

class TagMutations extends StoreMutations {
  const TagMutations._(super.ref);

  Future<Tag> create(String name, {required bool isPrivate, String? parentId}) async {
    final tag = await read(tagApiRepositoryProvider).create(name, isPrivate: isPrivate, parentId: parentId);
    invalidate(_fetchedTagsProvider);
    return tag;
  }

  Future<void> update(Tag tag, {required String name, bool? isPrivate}) async {
    await read(tagApiRepositoryProvider).update(tag, name: name, isPrivate: isPrivate);
    refresh(sync: isPrivate != null && isPrivate != tag.isPrivate);
  }

  Future<void> delete(Tag tag) async {
    await read(tagApiRepositoryProvider).delete(tag.id);
    refresh();
  }

  Future<int> addAssets(Tag tag, List<String> ids, {required bool isPrivate}) async {
    if (ids.isEmpty) {
      return 0;
    }
    final added = await read(tagApiRepositoryProvider).addAssets(tag.id, ids);
    if (isPrivate) {
      await read(assetServiceProvider).hidePrivateAssets(added);
    }
    refresh(sync: isPrivate);
    return added.length;
  }

  void refresh({bool sync = false}) {
    invalidate(_fetchedTagsProvider);
    invalidate(_assetsProvider);
    invalidate(_forAssetProvider);
    if (sync) {
      unawaited(read(backgroundSyncProvider).syncRemote(enqueue: true));
    }
  }

  /// Create the tags named [values], returning the list of successfully created (or pre-existing) tags
  Future<List<Tag>> upsert(List<String> values) async {
    try {
      return await read(tagApiRepositoryProvider).upsert(values);
    } catch (error, stack) {
      _log.severe("Failed to upsert tags", error, stack);
      rethrow;
    }
  }

  /// Apply every tag in [tagIds] to every asset in [assetIds], returning the number of assets successfully tagged
  Future<int> applyToAssets(List<String> assetIds, List<String> tagIds) async {
    try {
      return await read(tagApiRepositoryProvider).bulkTagAssets(assetIds, tagIds);
    } catch (error, stack) {
      _log.severe("Failed to tag assets", error, stack);
      rethrow;
    }
  }

  /// Remove the tag [tagId] from every asset in [assetIds], returning the number of assets successfully untagged
  Future<int> removeFromAssets(String tagId, List<String> assetIds) async {
    try {
      return await read(tagApiRepositoryProvider).untagAssets(tagId, assetIds);
    } catch (error, stack) {
      _log.severe("Failed to untag assets", error, stack);
      rethrow;
    }
  }
}
