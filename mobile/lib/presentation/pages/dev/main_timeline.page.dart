import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/feature_message/feature_message_dialog.widget.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/feature_message.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_ui/immich_ui.dart';

@RoutePage()
class MainTimelinePage extends ConsumerStatefulWidget {
  const MainTimelinePage({super.key});

  @override
  ConsumerState<MainTimelinePage> createState() => _MainTimelinePageState();
}

class _MainTimelinePageState extends ConsumerState<MainTimelinePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) {
        return;
      }
      final service = ref.read(featureMessageServiceProvider);
      if (!service.shouldShow()) {
        return;
      }

      await service.markSeen();
      if (!mounted) {
        return;
      }

      await showFeatureMessageDialog(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final hasMemories = ref.watch(driftMemoryLaneProvider.select((state) => state.value?.isNotEmpty ?? false));
    return Timeline(
      topSliverWidget: const SliverToBoxAdapter(child: DriftMemoryLane()),
      topSliverWidgetHeight: hasMemories ? 200 : 0,
      showStorageIndicator: true,
      appBar: const ImmichSliverAppBar(
        floating: true,
        pinned: false,
        snap: false,
        actions: [_AssetOriginFilterButton()],
      ),
    );
  }
}

class _AssetOriginFilterButton extends ConsumerWidget {
  const _AssetOriginFilterButton();

  IconData _tbIcon(AssetOriginFilter filter) => switch (filter) {
    AssetOriginFilter.all => Icons.filter_alt,
    AssetOriginFilter.remote => Icons.dns,
    AssetOriginFilter.local => Icons.smartphone,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentSelection = ref.watch(assetOriginFilterProvider);

    return ImmichMenu(
      style: MenuStyle(
        elevation: const WidgetStatePropertyAll(1),
        shape: WidgetStateProperty.all(
          const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.all(4)),
      ),
      builder: (context, controller, child) {
        return IconButton(
          onPressed: () => controller.isOpen ? controller.close() : controller.open(),
          icon: Icon(_tbIcon(currentSelection)),
          tooltip: context.t.timeline_filter_tooltip,
        );
      },
      children: [
        ImmichMenuItem(
          icon: currentSelection == AssetOriginFilter.all ? Icons.filter_alt : Icons.filter_alt_outlined,
          label: context.t.timeline_filter_all,
          onPressed: () => ref.read(assetOriginFilterProvider.notifier).setFilter(AssetOriginFilter.all),
        ),
        ImmichMenuItem(
          icon: currentSelection == AssetOriginFilter.remote ? Icons.dns : Icons.dns_outlined,
          label: context.t.timeline_filter_remote,
          onPressed: () => ref.read(assetOriginFilterProvider.notifier).setFilter(AssetOriginFilter.remote),
        ),
        ImmichMenuItem(
          icon: currentSelection == AssetOriginFilter.local ? Icons.smartphone : Icons.smartphone_outlined,
          label: context.t.timeline_filter_local,
          onPressed: () => ref.read(assetOriginFilterProvider.notifier).setFilter(AssetOriginFilter.local),
        ),
      ],
    );
  }
}
