import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/albums/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:isar/isar.dart';

@RoutePage<AssetSelectionPageResult?>()
class AssetSelectionPage extends HookConsumerWidget {
  const AssetSelectionPage({
    super.key,
    required this.existingAssets,
    this.canDeselect = false,
    required this.query,
  });

  final Set<Asset> existingAssets;
  final QueryBuilder<Asset, Asset, QAfterSortBy>? query;
  final bool canDeselect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final renderList = ref.watch(renderListQueryProvider(query));
    final selected = useState<Set<Asset>>(existingAssets);
    final selectionEnabledHook = useState(true);

    String buildAssetCountText() {
      return selected.value.length.toString();
    }

    Widget buildBody(RenderList renderList) {
      return ImmichAssetGrid(
        renderList: renderList,
        listener: (active, assets) {
          selectionEnabledHook.value = active;
          selected.value = assets;
        },
        selectionActive: true,
        preselectedAssets: existingAssets,
        canDeselect: canDeselect,
        showMultiSelectIndicator: false,
      );
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () {
            AutoRouter.of(context).popForced(null);
          },
        ),
        title: selected.value.isEmpty
            ? const Text(
                'share_add_photos',
                style: TextStyle(fontSize: 18),
              ).tr()
            : Text(
                buildAssetCountText(),
                style: const TextStyle(fontSize: 18),
              ),
        centerTitle: false,
        actions: [
          if (selected.value.isNotEmpty || canDeselect)
            TextButton(
              onPressed: () {
                var payload =
                    AssetSelectionPageResult(selectedAssets: selected.value);
                AutoRouter.of(context)
                    .popForced<AssetSelectionPageResult>(payload);
              },
              child: Text(
                canDeselect ? "share_done" : "share_add",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: context.primaryColor,
                ),
              ).tr(),
            ),
        ],
      ),
      body: renderList.widgetWhen(
        onData: (data) => buildBody(data),
      ),
    );
  }
}
