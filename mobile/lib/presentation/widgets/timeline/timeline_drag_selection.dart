import 'dart:async';
import 'dart:collection';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline_drag_region.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

/// Listens to long hold drags on a timeline [ScrollView] and handles multi-select scenarios with automated scrolling
class TimelineDragSelection extends ConsumerStatefulWidget {
  const TimelineDragSelection({super.key, required this.builder});

  final Widget Function(ScrollPhysics? physics) builder;

  @override
  ConsumerState createState() => _TimelineDragSelectionState();
}

class _TimelineDragSelectionState extends ConsumerState<TimelineDragSelection> {
  bool _dragging = false;
  TimelineAssetIndex? _dragAnchorIndex;
  final Set<BaseAsset> _draggedAssets = HashSet();
  ScrollPhysics? _scrollPhysics;

  void _setDragStartIndex(TimelineAssetIndex index) {
    setState(() {
      _scrollPhysics = const ClampingScrollPhysics();
      _dragAnchorIndex = index;
      _dragging = true;
    });
  }

  void _stopDrag() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Update the physics post frame to prevent sudden change in physics on iOS.
      if (mounted) {
        setState(() {
          _scrollPhysics = null;
        });
      }
    });
    setState(() {
      _dragging = false;
      _draggedAssets.clear();
    });
    final timelineState = ref.read(timelineStateProvider.notifier);
    Future.delayed(const Duration(milliseconds: 300), () {
      timelineState.setScrolling(false);
    });
  }

  Future<void> _dragScroll(ScrollDirection direction) {
    final scrollController = PrimaryScrollController.of(context);
    return scrollController.animateTo(
      scrollController.offset + (direction == ScrollDirection.forward ? 175 : -175),
      duration: const Duration(milliseconds: 125),
      curve: Curves.easeOut,
    );
  }

  void _handleDragAssetEnter(TimelineAssetIndex index) {
    if (_dragAnchorIndex == null || !_dragging) {
      return;
    }

    final timelineService = ref.read(timelineServiceProvider);
    final dragAnchorIndex = _dragAnchorIndex!;

    // Calculate the range of assets to select
    final startIndex = math.min(dragAnchorIndex.assetIndex, index.assetIndex);
    final endIndex = math.max(dragAnchorIndex.assetIndex, index.assetIndex);
    final count = endIndex - startIndex + 1;

    // Load the assets in the range
    if (timelineService.hasRange(startIndex, count)) {
      final selectedAssets = timelineService.getAssets(startIndex, count);

      // Clear previous drag selection and add new range
      final multiSelectNotifier = ref.read(multiSelectProvider.notifier);
      for (final asset in _draggedAssets) {
        multiSelectNotifier.deselectAsset(asset);
      }
      _draggedAssets.clear();

      for (final asset in selectedAssets) {
        multiSelectNotifier.selectAsset(asset);
        _draggedAssets.add(asset);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);

    return TimelineDragRegion(
      onStart: !isReadonlyModeEnabled ? _setDragStartIndex : null,
      onAssetEnter: _handleDragAssetEnter,
      onEnd: !isReadonlyModeEnabled ? _stopDrag : null,
      onScroll: (direction) => unawaited(_dragScroll(direction)),
      onScrollStart: () {
        // Minimize the bottom sheet when drag selection starts
        // TODO(agg23): When isReadonlyModeEnabled, onEnd has not been set, so there is never a trailing setScrolling(false), sticking to isInteracting until the next interaction
        ref.read(timelineStateProvider.notifier).setScrolling(true);
      },
      child: widget.builder(_scrollPhysics),
    );
  }
}
