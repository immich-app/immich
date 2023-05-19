import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';

class AssetSelectionPage extends HookConsumerWidget {
  const AssetSelectionPage({
    Key? key,
    required this.existingAssets,
    this.isNewAlbum = false,
  }) : super(key: key);

  final Set<Asset> existingAssets;
  final bool isNewAlbum;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final renderList = ref.watch(remoteAssetsProvider(currentUser?.isarId));
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
        preselectedAssets: isNewAlbum ? selected.value : existingAssets,
        canDeselect: isNewAlbum,
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
          if (selected.value.isNotEmpty)
            TextButton(
              onPressed: () {
                var payload =
                    AssetSelectionPageResult(selectedAssets: selected.value);
                AutoRouter.of(context)
                    .popForced<AssetSelectionPageResult>(payload);
              },
              child: const Text(
                "share_add",
                style: TextStyle(fontWeight: FontWeight.bold),
              ).tr(),
            ),
        ],
      ),
      body: renderList.when(
        data: (data) => buildBody(data),
        error: (error, stackTrace) => Center(
          child: Text(error.toString()),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
