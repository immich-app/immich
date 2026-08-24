import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/feature_message/feature_message_dialog.widget.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/feature_message.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';

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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentSelection = ref.watch(assetOriginFilterProvider);

    return MenuAnchor(
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
          icon: const Icon(Icons.filter_list_rounded),
          tooltip: 'timeline_filter_tooltip'.tr(),
        );
      },
      menuChildren: [
        _buildItem(
          context,
          ref,
          AssetOriginFilter.all,
          'timeline_filter_all'.tr(),
          Icons.photo_library_outlined,
          Icons.photo_library,
          currentSelection,
        ),
        _buildItem(
          context,
          ref,
          AssetOriginFilter.remote,
          'timeline_filter_remote'.tr(),
          Icons.cloud_outlined,
          Icons.cloud,
          currentSelection,
        ),
        _buildItem(
          context,
          ref,
          AssetOriginFilter.local,
          'timeline_filter_local'.tr(),
          Icons.cloud_off_outlined,
          Icons.cloud_off,
          currentSelection,
        ),
      ],
    );
  }

  Widget _buildItem(
    BuildContext context,
    WidgetRef ref,
    AssetOriginFilter staticFilter,
    String label,
    IconData icon,
    IconData iconActive,
    AssetOriginFilter currentFilter,
  ) {
    final isSelected = staticFilter == currentFilter;
    final primaryColor = context.colorScheme.primary;

    return MenuItemButton(
      onPressed: () => ref.read(assetOriginFilterProvider.notifier).state = staticFilter,
      child: ListTile(
        leading: Icon(isSelected ? iconActive : icon, color: isSelected ? primaryColor : null),
        title: Text(
          label,
          style: context.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w500,
            color: isSelected ? primaryColor : null,
          ),
        ),
        selected: isSelected,
        selectedColor: primaryColor,
      ),
    );
  }
}
