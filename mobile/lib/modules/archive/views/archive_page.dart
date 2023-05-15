import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/archive/providers/archive_asset_provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class ArchivePage extends HookConsumerWidget {
  const ArchivePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final archivedAssets = ref.watch(archiveProvider);
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
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'archive_page_title',
        ).tr(args: [count]),
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
                              if (selection.value.isNotEmpty) {
                                await ref
                                    .watch(assetProvider.notifier)
                                    .toggleArchive(
                                      selection.value.toList(),
                                      false,
                                    );

                                final assetOrAssets = selection.value.length > 1
                                    ? 'assets'
                                    : 'asset';
                                ImmichToast.show(
                                  context: context,
                                  msg:
                                      'Moved ${selection.value.length} $assetOrAssets to library',
                                  gravity: ToastGravity.CENTER,
                                );
                              }
                            } finally {
                              processing.value = false;
                              selectionEnabledHook.value = false;
                            }
                          },
                  )
                ],
              ),
            ),
          ),
        ),
      );
    }

    return archivedAssets.when(
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
                child: Text('archive_page_no_archived_assets'.tr()),
              )
            : Stack(
                children: [
                  ImmichAssetGrid(
                    renderList: data,
                    listener: selectionListener,
                    selectionActive: selectionEnabledHook.value,
                  ),
                  if (selectionEnabledHook.value) buildBottomBar(),
                  if (processing.value)
                    const Center(child: ImmichLoadingIndicator())
                ],
              ),
      ),
    );
  }
}
