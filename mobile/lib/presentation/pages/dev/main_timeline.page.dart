import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
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
    final setFilter = ref.watch(assetOriginFilterProvider.notifier).setFilter;

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
          tooltip: context.t.timeline_filter_tooltip,
        );
      },
      menuChildren: [
        _FilterMenuItem(
          AssetOriginFilter.all,
          context.t.timeline_filter_all,
          Icons.photo_library_outlined,
          Icons.photo_library,
          currentSelection,
          setFilter,
        ),
        _FilterMenuItem(
          AssetOriginFilter.remote,
          context.t.timeline_filter_remote,
          Icons.cloud_outlined,
          Icons.cloud,
          currentSelection,
          setFilter,
        ),
        _FilterMenuItem(
          AssetOriginFilter.local,
          context.t.timeline_filter_local,
          Icons.cloud_off_outlined,
          Icons.cloud_off,
          currentSelection,
          setFilter,
        ),
      ],
    );
  }
}

class _FilterMenuItem extends StatelessWidget {
  final AssetOriginFilter staticFilter;
  final String label;
  final IconData icon;
  final IconData iconActive;
  final AssetOriginFilter currentFilter;
  final ValueChanged<AssetOriginFilter> onSelected;

  const _FilterMenuItem(this.staticFilter, this.label, this.icon, this.iconActive, this.currentFilter, this.onSelected);

  @override
  Widget build(BuildContext context) {
    final isSelected = staticFilter == currentFilter;
    final primaryColor = context.colorScheme.primary;

    return MenuItemButton(
      onPressed: () => onSelected(staticFilter),
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
