import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/timeline.provider.dart';
import 'package:immich_mobile/providers/trash.provider.dart';
import 'package:immich_mobile/utils/immich_loading_overlay.dart';
import 'package:immich_mobile/widgets/asset_grid/delete_dialog.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class TrashPage extends HookConsumerWidget {
  const TrashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trashRenderList = ref.watch(trashTimelineProvider);
    final trashDays =
        ref.watch(serverInfoProvider.select((v) => v.serverConfig.trashDays));
    final selectionEnabledHook = useState(false);
    final selection = useState(<Asset>{});
    final processing = useProcessingOverlay();

    void selectionListener(
      bool multiselect,
      Set<Asset> selectedAssets,
    ) {
      selectionEnabledHook.value = multiselect;
      selection.value = selectedAssets;
    }

    onEmptyTrash() async {
      processing.value = true;
      await ref.read(trashProvider.notifier).emptyTrash();
      processing.value = false;
      selectionEnabledHook.value = false;
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: 'trash_emptied'.tr(),
          gravity: ToastGravity.BOTTOM,
        );
      }
    }

    handleEmptyTrash() async {
      await showDialog(
        context: context,
        builder: (context) => ConfirmDialog(
          onOk: () => onEmptyTrash(),
          title: "empty_trash".tr(),
          ok: "ok".tr(),
          content: "trash_page_empty_trash_dialog_content".tr(),
        ),
      );
    }

    Future<void> onPermanentlyDelete() async {
      processing.value = true;
      try {
        if (selection.value.isNotEmpty) {
          final isRemoved = await ref
              .read(assetProvider.notifier)
              .deleteAssets(selection.value, force: true);

          if (isRemoved) {
            if (context.mounted) {
              ImmichToast.show(
                context: context,
                msg: 'assets_deleted_permanently'
                    .tr(namedArgs: {'count': "${selection.value.length}"}),
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

    handlePermanentDelete() async {
      await showDialog(
        context: context,
        builder: (context) => DeleteDialog(
          alert: "delete_dialog_alert_remote",
          onDelete: () => onPermanentlyDelete(),
        ),
      );
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
              .read(trashProvider.notifier)
              .restoreAssets(selection.value);

          if (result && context.mounted) {
            ImmichToast.show(
              context: context,
              msg: 'assets_restored_successfully'
                  .tr(namedArgs: {'count': "${selection.value.length}"}),
              gravity: ToastGravity.BOTTOM,
            );
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
            : "trash_page_select_assets_btn".tr();
      }
      return 'trash_page_title'.tr(namedArgs: {'count': count});
    }

    AppBar buildAppBar(String count) {
      return AppBar(
        leading: IconButton(
          onPressed: !selectionEnabledHook.value
              ? () => context.maybePop()
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
                    child: const Text('select').tr(),
                  ),
                  PopupMenuItem(
                    value: handleEmptyTrash,
                    child: const Text('empty_trash').tr(),
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
              color: context.themeData.canvasColor,
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
                          ? 'trash_page_delete_all'.tr()
                          : 'delete'.tr(),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.red[400],
                        fontWeight: FontWeight.bold,
                      ),
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
                          ? 'trash_page_restore_all'.tr()
                          : 'restore'.tr(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
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

    return Scaffold(
      appBar: trashRenderList.maybeWhen(
        orElse: () => buildAppBar("?"),
        data: (data) => buildAppBar(data.totalAssets.toString()),
      ),
      body: trashRenderList.widgetWhen(
        onData: (data) => data.isEmpty
            ? Center(
                child: Text('trash_page_no_assets'.tr()),
              )
            : Stack(
                children: [
                  SafeArea(
                    child: ImmichAssetGrid(
                      renderList: data,
                      listener: selectionListener,
                      selectionActive: selectionEnabledHook.value,
                      showMultiSelectIndicator: false,
                      showStack: true,
                      topWidget: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 24,
                        ),
                        child: const Text(
                          "trash_page_info",
                        ).tr(namedArgs: {"days": "$trashDays"}),
                      ),
                    ),
                  ),
                  if (selectionEnabledHook.value) buildBottomBar(),
                ],
              ),
      ),
    );
  }
}
