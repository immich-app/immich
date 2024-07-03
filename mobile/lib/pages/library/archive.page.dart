import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/archive.provider.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';

@RoutePage()
class ArchivePage extends HookConsumerWidget {
  const ArchivePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AppBar buildAppBar() {
      final archivedAssets = ref.watch(archiveProvider);
      final count = archivedAssets.value?.totalAssets.toString() ?? "?";
      return AppBar(
        leading: IconButton(
          onPressed: () => context.maybePop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'archive_page_title',
        ).tr(args: [count]),
      );
    }

    return Scaffold(
      appBar: ref.watch(multiselectProvider) ? null : buildAppBar(),
      body: MultiselectGrid(
        renderListProvider: archiveProvider,
        unarchive: true,
        archiveEnabled: true,
        deleteEnabled: true,
        editEnabled: true,
      ),
    );
  }
}
