import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/providers/timeline.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';

@RoutePage()
class ArchivePage extends HookConsumerWidget {
  const ArchivePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AppBar buildAppBar() {
      final archiveRenderList = ref.watch(archiveTimelineProvider);
      final count = archiveRenderList.value?.totalAssets.toString() ?? "?";
      return AppBar(
        leading: IconButton(
          onPressed: () => context.maybePop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'archive_page_title',
        ).tr(namedArgs: {'count': count}),
      );
    }

    return Scaffold(
      appBar: ref.watch(multiselectProvider) ? null : buildAppBar(),
      body: MultiselectGrid(
        renderListProvider: archiveTimelineProvider,
        unarchive: true,
        archiveEnabled: true,
        deleteEnabled: true,
        editEnabled: true,
      ),
    );
  }
}
