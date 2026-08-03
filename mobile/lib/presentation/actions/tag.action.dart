import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';

final _stateProvider = Provider.family.autoDispose<List<String>?, ActionSource>((ref, source) {
  final tagsEnabled = ref.watch(
    userMetadataPreferencesProvider.select((value) => value.valueOrNull?.tagsEnabled ?? false),
  );
  if (!tagsEnabled) {
    return null;
  }

  final assets = ref.watch(ownedAssetsActionProvider(source));
  final assetIds = assets.map((asset) => asset.id).toList(growable: false);
  return assetIds.isEmpty ? null : assetIds;
});

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

@visibleForTesting
Future<void> tagAssets(
  BuildContext context,
  WidgetRef ref,
  List<String> assetIds, {
  required Set<String> selected,
  required Set<String> created,
}) async {
  final tagService = ref.read(tagServiceProvider);
  final toastService = ref.read(toastServiceProvider);
  final tagIds = {...selected};

  if (created.isNotEmpty) {
    final tags = await tagService.upsertTags(created.toList());
    tagIds.addAll(tags.map((tag) => tag.id));
  }
  if (tagIds.isEmpty) {
    return;
  }

  final count = await tagService.bulkTagAssets(assetIds, tagIds.toList());
  ref.invalidate(tagProvider);
  if (context.mounted) {
    toastService.success(context.t.tagged_assets(count: count));
  }
}
