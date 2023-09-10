import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/recycle_bin/providers/recycled_asset.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class RecycleBinPage extends HookConsumerWidget {
  const RecycleBinPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recycledAssets = ref.watch(recycledAssetsProvider);
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

    AppBar buildAppBar(String count) {
      return AppBar(
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        centerTitle: !selectionEnabledHook.value,
        automaticallyImplyLeading: false,
        title: selectionEnabledHook.value
            ? Text("${selection.value.length}")
            : const Text(
                'Recycle Bin ({})',
              ).tr(args: [count]),
        actions: <Widget>[
          PopupMenuButton<void Function()>(
            itemBuilder: (context) {
              return [
                PopupMenuItem(
                  value: () => ref.read(assetProvider.notifier).deleteAssets(
                        ref.read(allRecycledAssetsProvider),
                        force: true,
                      ),
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
            child: Card(
              child: Column(
                children: [
                  ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    leading: const Icon(
                      Icons.unarchive_rounded,
                    ),
                    title: Text(
                      'control_bottom_app_bar_unarchive'.tr(),
                      style: const TextStyle(fontSize: 14),
                    ),
                    onTap: processing.value
                        ? null
                        : () async {
                            processing.value = true;
                            try {
                              await handleArchiveAssets(
                                ref,
                                context,
                                selection.value.toList(),
                                shouldArchive: false,
                              );
                            } finally {
                              processing.value = false;
                              selectionEnabledHook.value = false;
                            }
                          },
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return recycledAssets.when(
      loading: () => Scaffold(
        appBar: buildAppBar("?"),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (error, stackTrace) => Scaffold(
        appBar: buildAppBar("Error"),
        body: Center(child: Text(error.toString())),
      ),
      data: (data) => Scaffold(
        appBar: buildAppBar(data.totalAssets.toString()),
        body: data.isEmpty
            ? Center(
                child: Text('No recycled assets'.tr()),
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
