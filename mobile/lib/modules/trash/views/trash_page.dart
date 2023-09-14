import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/trash/providers/trashed_asset.provider.dart';
import 'package:immich_mobile/modules/trash/services/trash.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class TrashPage extends HookConsumerWidget {
  const TrashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trashedAssets = ref.watch(trashedAssetsProvider);
    final selectionEnabledHook = useState(false);
    final selection = useState(<Asset>{});
    final processing = useState(false);

    void selectionListener(
      bool multiselect,
      Set<Asset> selectedAssets,
    ) {
      selectionEnabledHook.value = multiselect;
      selection.value = selectedAssets;
    }

    handleEmptyTrash() async {
      processing.value = true;
      await ref.read(trashProvider.notifier).emptyTrash();
      processing.value = false;
      selectionEnabledHook.value = false;
    }

    Future<void> handlePermanentDelete() async {
      processing.value = true;
      try {
        if (selection.value.isNotEmpty) {
          await ref
              .read(assetProvider.notifier)
              .deleteAssets(selection.value, force: true);

          final assetOrAssets = selection.value.length > 1 ? 'assets' : 'asset';
          if (context.mounted) {
            ImmichToast.show(
              context: context,
              msg:
                  '${selection.value.length} $assetOrAssets deleted permanently',
              gravity: ToastGravity.BOTTOM,
            );
          }
        }
      } finally {
        processing.value = false;
        selectionEnabledHook.value = false;
      }
    }

    Future<void> handleRestoreAll() async {
      processing.value = true;
      await ref.read(trashProvider.notifier).restoreTrash();
      processing.value = false;
      selectionEnabledHook.value = false;
    }

    Future<void> handleRestore() async {
      processing.value = true;
      try {
        if (selection.value.isNotEmpty) {
          final result = await ref
              .read(trashServiceProvider)
              .restoreAssets(selection.value);

          final assetOrAssets = selection.value.length > 1 ? 'assets' : 'asset';
          if (result) {
            await ref.read(assetProvider.notifier).getAllAsset();
            if (context.mounted) {
              ImmichToast.show(
                context: context,
                msg:
                    '${selection.value.length} $assetOrAssets restored successfully',
                gravity: ToastGravity.BOTTOM,
              );
            }
          }
        }
      } finally {
        processing.value = false;
        selectionEnabledHook.value = false;
      }
    }

    String getAppBarTitle(String count) {
      if (selectionEnabledHook.value) {
        return selection.value.isNotEmpty
            ? "${selection.value.length}"
            : "Select assets";
      }
      return 'Trash ({})'.tr(args: [count]);
    }

    AppBar buildAppBar(String count) {
      return AppBar(
        leading: IconButton(
          onPressed: !selectionEnabledHook.value
              ? () => AutoRouter.of(context).pop()
              : () {
                  selectionEnabledHook.value = false;
                  selection.value = {};
                },
          icon: !selectionEnabledHook.value
              ? const Icon(Icons.arrow_back_ios_rounded)
              : const Icon(Icons.close_rounded),
        ),
        centerTitle: !selectionEnabledHook.value,
        automaticallyImplyLeading: false,
        title: Text(getAppBarTitle(count)),
        actions: <Widget>[
          if (!selectionEnabledHook.value)
            PopupMenuButton<void Function()>(
              itemBuilder: (context) {
                return [
                  PopupMenuItem(
                    value: () => selectionEnabledHook.value = true,
                    child: const Text('Select'),
                  ),
                  PopupMenuItem(
                    value: handleEmptyTrash,
                    child: const Text('Empty bin'),
                  ),
                ];
              },
              onSelected: (fn) => fn(),
            ),
        ],
      );
    }

    Widget buildBottomBar() {
      return SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: SizedBox(
            height: 64,
            child: Container(
              color: Theme.of(context).canvasColor,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  TextButton.icon(
                    icon: Icon(
                      Icons.delete_forever,
                      color: Colors.red[400],
                    ),
                    label: Text(
                      selection.value.isEmpty
                          ? 'Delete All'.tr()
                          : 'Delete'.tr(),
                      style: TextStyle(fontSize: 14, color: Colors.red[400]),
                    ),
                    onPressed: processing.value
                        ? null
                        : selection.value.isEmpty
                            ? handleEmptyTrash
                            : handlePermanentDelete,
                  ),
                  TextButton.icon(
                    icon: const Icon(
                      Icons.history_rounded,
                    ),
                    label: Text(
                      selection.value.isEmpty
                          ? 'Restore All'.tr()
                          : 'Restore'.tr(),
                      style: const TextStyle(fontSize: 14),
                    ),
                    onPressed: processing.value
                        ? null
                        : selection.value.isEmpty
                            ? handleRestoreAll
                            : handleRestore,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return trashedAssets.when(
      loading: () => Scaffold(
        appBar: buildAppBar("?"),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (error, stackTrace) => Scaffold(
        appBar: buildAppBar("!"),
        body: Center(child: Text(error.toString())),
      ),
      data: (data) => Scaffold(
        appBar: buildAppBar(data.totalAssets.toString()),
        body: data.isEmpty
            ? Center(
                child: Text('No trashed assets'.tr()),
              )
            : Stack(
                children: [
                  SafeArea(
                    child: ImmichAssetGrid(
                      renderList: data,
                      listener: selectionListener,
                      selectionActive: selectionEnabledHook.value,
                      showMultiSelectIndicator: false,
                      topWidget: const Padding(
                        padding: EdgeInsets.only(
                          top: 24,
                          bottom: 24,
                          left: 12,
                          right: 12,
                        ),
                        child: Text(
                          "Backed up items will be permanently deleted after 60 days",
                        ),
                      ),
                    ),
                  ),
                  if (selectionEnabledHook.value) buildBottomBar(),
                  if (processing.value)
                    const Center(child: ImmichLoadingIndicator()),
                ],
              ),
      ),
    );
  }
}
