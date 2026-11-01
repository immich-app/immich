import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/widgets/tags/private_content_auth.dart';
import 'package:immich_mobile/presentation/widgets/tags/tag_picker.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

final _stateProvider = Provider.family.autoDispose<List<String>?, ActionSource>((ref, source) {
  final tagsEnabled = ref.watch(
    Store.userMetadata.preferences().select((value) => value.valueOrNull?.tagsEnabled ?? false),
  );
  if (!tagsEnabled) {
    return null;
  }

  final assets = ref.watch(ownedAssetsActionProvider(source));
  final assetIds = assets.map((asset) => asset.id).toList(growable: false);
  return assetIds.isEmpty ? null : assetIds;
}, dependencies: [ownedAssetsActionProvider]);

class TagAction extends AssetActionBuilder {
  const TagAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final assetIds = ref.watch(_stateProvider(source));
    if (assetIds == null) {
      return null;
    }

    return .new(
      icon: Icons.sell_outlined,
      label: context.t.control_bottom_app_bar_add_tags,
      onAction: () => _tag(context, ref, assetIds),
    );
  }

  Future<void> _tag(BuildContext context, WidgetRef ref, List<String> assetIds) async {
    final clearSelection = ref.read(clearSelectionProvider(source));
    try {
      final results = await showTagPickerModal(context: context);
      if (results == null || !context.mounted) {
        return;
      }

      final (selected, created) = results;
      await tagAssets(context, ref, assetIds, selected: selected, created: created);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to tag the assets");
    }
  }
}

class PrivateTagAction extends AssetActionBuilder {
  const PrivateTagAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final ids = ref.watch(ownedAssetsActionProvider(source)).map((asset) => asset.id).toList();
    if (ids.isEmpty) {
      return null;
    }

    return .new(
      icon: Icons.lock_outline,
      label: context.t.add_to_private_tag,
      onAction: () async {
        final alreadyUnlocked = ref.read(privateSessionProvider);
        final session = ref.read(privateSessionProvider.notifier);
        try {
          if (!await unlockPrivateContent(context, ref) || !context.mounted) {
            return;
          }
          final result = await showTagPickerModal(context: context, privateOnly: true);
          if (result == null || !context.mounted || !ref.read(privateSessionProvider)) {
            return;
          }
          await tagAssets(context, ref, ids, selected: result.$1, created: const {});
          if (context.mounted) {
            ref.read(clearSelectionProvider(source))();
          }
        } catch (error, stack) {
          handleError(error, stack: stack);
        } finally {
          if (!alreadyUnlocked && session.mounted) {
            await session.lock();
          }
        }
      },
    );
  }
}

@visibleForTesting
Future<void> tagAssets(
  BuildContext context,
  WidgetRef ref,
  List<String> assetIds, {
  required Set<String> selected,
  required Set<String> created,
}) async {
  final toastService = ref.read(toastServiceProvider);
  final tagIds = {...selected};

  if (created.isNotEmpty) {
    final tags = await ref.read(Store.tags).upsert(created.toList());
    tagIds.addAll(tags.map((tag) => tag.id));
  }

  if (tagIds.isEmpty || !context.mounted) {
    return;
  }

  final store = ref.read(Store.tags);
  var count = 0;
  if (ref.read(privateSessionProvider)) {
    final tags = await ref.read(Store.tags.all().future);
    for (final tag in tags.where((tag) => tagIds.contains(tag.id) && tags.isEffectivelyPrivate(tag))) {
      if (!context.mounted || !ref.read(privateSessionProvider)) {
        return;
      }
      count += await store.addAssets(tag, assetIds, isPrivate: true);
      tagIds.remove(tag.id);
    }
  }
  if (tagIds.isNotEmpty) {
    count += await store.applyToAssets(assetIds, tagIds.toList());
  }
  ref.invalidate(Store.tags.forAsset);
  if (context.mounted) {
    toastService.success(context.t.tagged_assets(count: count));
  }
}

class UntagAction extends AssetActionBuilder {
  final String tagId;
  final bool isPrivate;

  const UntagAction({required super.source, required this.tagId, this.isPrivate = false});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final assetIds = ref.watch(ownedAssetsActionProvider(source)).map((asset) => asset.id).toList();
    if (assetIds.isEmpty) {
      return null;
    }

    return .new(icon: Icons.close, label: context.t.remove_tag, onAction: () => _untag(context, ref, assetIds, tagId));
  }

  Future<void> _untag(BuildContext context, WidgetRef ref, List<String> assetIds, String tagId) async {
    if (isPrivate) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => ConfirmDialog(
          title: context.t.remove_tag,
          content: context.t.remove_private_tag_confirmation,
          ok: context.t.remove_tag,
        ),
      );
      if (confirmed != true || !context.mounted || !ref.read(privateSessionProvider)) {
        return;
      }
    }
    try {
      final count = await ref.read(Store.tags).removeFromAssets(tagId, assetIds);
      ref.read(Store.tags).refresh(sync: isPrivate);
      if (context.mounted) {
        ref.read(toastServiceProvider).success(context.t.removed_tagged_assets(count: count));
      }
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to remove the tag");
    }
  }
}
