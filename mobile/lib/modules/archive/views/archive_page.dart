import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/archive/providers/archive_asset_provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

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
          onPressed: () => context.autoPop(),
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
              child: ListTile(
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(10)),
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
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: archivedAssets.maybeWhen(
        data: (data) => buildAppBar(data.totalAssets.toString()),
        orElse: () => buildAppBar("?"),
      ),
      body: archivedAssets.widgetWhen(
        onData: (data) => data.isEmpty
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
                    const Center(child: ImmichLoadingIndicator()),
                ],
              ),
      ),
    );
  }
}
