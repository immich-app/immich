import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/albums/asset_selection_page_result.model.dart';
import 'package:immich_mobile/providers/asset_viewer/render_list.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid.dart';
import 'package:isar/isar.dart';

@RoutePage()
class AlbumAssetSelectionPage extends HookConsumerWidget {
  const AlbumAssetSelectionPage({
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
        onPopInvoked: (selectedAssets) {
          _onPopInvoked(context, existingAssets, selectedAssets);
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () {
            _onPopInvoked(context, existingAssets, selected.value);
          },
        ),
        title: selected.value.isEmpty
            ? const Text(
                'share_add_photos',
                style: TextStyle(fontSize: 18),
              ).tr()
            : const Text(
                'share_assets_selected',
                style: TextStyle(fontSize: 18),
              ).tr(args: [selected.value.length.toString()]),
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

  Future<bool?> _showPopConfirmationDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false, // user must tap button!
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('album_viewer_add_photos_exit_dialog_title').tr(),
          content:
              const Text('album_viewer_add_photos_exit_dialog_content').tr(),
          actions: <Widget>[
            TextButton(
              onPressed: () => context.pop(false),
              child: Text(
                'action_common_cancel',
                style: TextStyle(
                  color: context.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
            ),
            TextButton(
              onPressed: () => context.pop(true),
              child: Text(
                'action_common_confirm',
                style: TextStyle(
                  color: context.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
            ),
          ],
        );
      },
    );
  }

  void _onPopInvoked(
    BuildContext context,
    Set<Asset> existingAssets,
    Set<Asset> selectedAssets,
  ) async {
    if (!context.mounted) {
      return;
    }

    final equality = const SetEquality<Asset>();
    final hasNotSelectedAssets =
        equality.equals(selectedAssets, existingAssets);

    // Exit the page without warning if no new assets are selected
    if (hasNotSelectedAssets) {
      AutoRouter.of(context).popForced();
    } else {
      final result = await _showPopConfirmationDialog(context);
      if (result == true) {
        AutoRouter.of(context).popForced();
      }
    }
  }
}
