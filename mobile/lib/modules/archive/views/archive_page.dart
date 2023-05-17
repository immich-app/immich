import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:isar/isar.dart';

class ArchivePage extends HookConsumerWidget {
  const ArchivePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final User me = Store.get(StoreKey.currentUser);
    final query = ref
        .watch(dbProvider)
        .assets
        .filter()
        .ownerIdEqualTo(me.isarId)
        .isArchivedEqualTo(true);
    final stream = query.watch();
    final archivedAssets = useState<List<Asset>>([]);
    final selectionEnabledHook = useState(false);
    final selection = useState(<Asset>{});

    useEffect(
      () {
        query.findAll().then((value) => archivedAssets.value = value);
        final subscription = stream.listen((e) {
          archivedAssets.value = e;
        });
        // Cancel the subscription when the widget is disposed
        return subscription.cancel;
      },
      [],
    );

    void selectionListener(
      bool multiselect,
      Set<Asset> selectedAssets,
    ) {
      selectionEnabledHook.value = multiselect;
      selection.value = selectedAssets;
    }

    AppBar buildAppBar() {
      return AppBar(
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'archive_page_title',
        ).tr(args: [archivedAssets.value.length.toString()]),
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
                    onTap: () {
                      if (selection.value.isNotEmpty) {
                        ref
                            .watch(assetProvider.notifier)
                            .toggleArchive(selection.value, false);

                        final assetOrAssets =
                            selection.value.length > 1 ? 'assets' : 'asset';
                        ImmichToast.show(
                          context: context,
                          msg:
                              'Moved ${selection.value.length} $assetOrAssets to library',
                          gravity: ToastGravity.CENTER,
                        );
                      }

                      selectionEnabledHook.value = false;
                    },
                  )
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: buildAppBar(),
      body: archivedAssets.value.isEmpty
          ? Center(
              child: Text('archive_page_no_archived_assets'.tr()),
            )
          : Stack(
              children: [
                ImmichAssetGrid(
                  assets: archivedAssets.value,
                  listener: selectionListener,
                  selectionActive: selectionEnabledHook.value,
                ),
                if (selectionEnabledHook.value) buildBottomBar()
              ],
            ),
    );
  }
}
