import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/albums/asset_selection_page_result.model.dart';
import 'package:immich_mobile/providers/timeline.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid.dart';

@RoutePage()
class AlbumAssetSelectionPage extends HookConsumerWidget {
  const AlbumAssetSelectionPage({
    super.key,
    required this.existingAssets,
    this.canDeselect = false,
  });

  final Set<Asset> existingAssets;
  final bool canDeselect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetSelectionRenderList = ref.watch(assetSelectionTimelineProvider);
    final selected = useState<Set<Asset>>(existingAssets);
    final selectionEnabledHook = useState(true);

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
                'add_photos',
                style: TextStyle(fontSize: 18),
              ).tr()
            : const Text(
                'share_assets_selected',
                style: TextStyle(fontSize: 18),
              ).tr(namedArgs: {'count': selected.value.length.toString()}),
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
                canDeselect ? "done" : "add",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: context.primaryColor,
                ),
              ).tr(),
            ),
        ],
      ),
      body: assetSelectionRenderList.widgetWhen(
        onData: (data) => buildBody(data),
      ),
    );
  }
}
