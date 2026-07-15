import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';

class TagAction extends BaseAction {
  final List<String> assetIds;

  TagAction._({required this.assetIds, required super.scope, super.isVisible})
    : super(icon: Icons.sell_outlined, label: scope.context.t.control_bottom_app_bar_add_tags);

  factory TagAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final assetIds = AssetFilter(assets).owned(scope.authUser.id).map((asset) => asset.id).toList(growable: false);
    return ._(assetIds: assetIds, scope: scope, isVisible: assetIds.isNotEmpty);
  }

  @override
  Future<void> onAction() async {
    final results = await showTagPickerModal(context: scope.context);
    if (results == null) {
      return;
    }

    await tagAssets(selected: results.$1, created: results.$2);
  }

  @visibleForTesting
  Future<void> tagAssets({required Set<String> selected, required Set<String> created}) async {
    final ActionScope(:context, :ref) = scope;
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
