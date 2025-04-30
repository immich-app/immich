import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/widgets/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/providers/search/recently_taken_asset.provider.dart';

@RoutePage()
class RecentlyTakenPage extends HookConsumerWidget {
  const RecentlyTakenPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recents = ref.watch(recentlyTakenAssetProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('recently_taken_page_title').tr(),
        leading: IconButton(
          onPressed: () => context.maybePop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: recents.widgetWhen(
        onData: (searchResponse) => ImmichAssetGrid(
          assets: searchResponse,
        ),
      ),
    );
  }
}
