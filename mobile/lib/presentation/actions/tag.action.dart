import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';

class TagAction extends BaseAction {
  const TagAction();

  @override
  IconData get icon => Icons.sell_outlined;

  @override
  String label(context) => context.t.control_bottom_app_bar_add_tags;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final assetIds = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);

    final results = await showTagPickerModal(context: context);
    if (results == null) {
      return;
    }

    await applyTags(ref, assetIds, selected: results.$1, created: results.$2);
  }

  @visibleForTesting
  Future<void> applyTags(
    WidgetRef ref,
    List<String> assetIds, {
    required Set<String> selected,
    required Set<String> created,
  }) async {
    final context = ref.context;

    final tagService = ref.read(tagServiceProvider);
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
    ref.read(toastRepositoryProvider).success(context.t.tagged_assets(count: count));
  }
}
