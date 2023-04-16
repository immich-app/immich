import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
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

    return Scaffold(
      appBar: buildAppBar(),
      body: ImmichAssetGrid(
        assets: archivedAssets.value,
      ),
    );
  }
}
