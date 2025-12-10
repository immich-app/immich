import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/viewer_quick_action_order.provider.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';
import 'package:immich_mobile/utils/action_button_visuals.dart';

class QuickActionConfigurator extends ConsumerStatefulWidget {
  const QuickActionConfigurator({super.key});

  @override
  ConsumerState<QuickActionConfigurator> createState() => _QuickActionConfiguratorState();
}

class _QuickActionConfiguratorState extends ConsumerState<QuickActionConfigurator> {
  late List<ActionButtonType> _order;
  late final ScrollController _scrollController;
  bool _hasLocalChanges = false;

  @override
  void initState() {
    super.initState();
    _order = List<ActionButtonType>.from(ref.read(viewerQuickActionOrderProvider));
    _scrollController = ScrollController();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onReorder(int oldIndex, int newIndex) {
    setState(() {
      final item = _order.removeAt(oldIndex);
      _order.insert(newIndex, item);
      _hasLocalChanges = true;
    });
  }

  void _resetToDefault() {
    setState(() {
      _order = List<ActionButtonType>.from(ActionButtonBuilder.defaultQuickActionOrder);
      _hasLocalChanges = true;
    });
  }

  void _cancel() => Navigator.of(context).pop();

  Future<void> _save() async {
    await ref.read(viewerQuickActionOrderProvider.notifier).setOrder(_order);
    _hasLocalChanges = false;
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const crossAxisCount = 4;
    const crossAxisSpacing = 12.0;
    const mainAxisSpacing = 12.0;
    const tileHeight = 130.0;
    final currentOrder = ref.watch(viewerQuickActionOrderProvider);
    if (!_hasLocalChanges && !listEquals(_order, currentOrder)) {
      _order = List<ActionButtonType>.from(currentOrder);
    }

    final hasChanges = !listEquals(currentOrder, _order);

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: 20, right: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20, top: 16),
        child: Column(
          mainAxisSize: MainAxisSize.max,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.25),
                borderRadius: const BorderRadius.all(Radius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Text('quick_actions_settings_title'.tr(), style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'quick_actions_settings_description'.tr(
                namedArgs: {'count': ActionButtonBuilder.defaultQuickActionLimit.toString()},
              ),
              style: theme.textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final rows = (_order.length / crossAxisCount).ceil().clamp(1, 4);
                  final naturalHeight = rows * tileHeight + (rows - 1) * mainAxisSpacing;
                  final shouldScroll = naturalHeight > constraints.maxHeight;
                  final horizontalPadding = 8.0;
                  final tileWidth =
                      (constraints.maxWidth - horizontalPadding - (crossAxisSpacing * (crossAxisCount - 1))) /
                      crossAxisCount;
                  final childAspectRatio = tileWidth / tileHeight;
                  final gridController = shouldScroll ? _scrollController : null;

                  return _ReorderableGrid(
                    scrollController: gridController,
                    items: _order,
                    onReorder: _onReorder,
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: crossAxisSpacing,
                    mainAxisSpacing: mainAxisSpacing,
                    childAspectRatio: childAspectRatio,
                    shouldScroll: shouldScroll,
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(onPressed: _resetToDefault, child: const Text('reset').tr()),
                Row(
                  children: [
                    TextButton(onPressed: _cancel, child: const Text('cancel').tr()),
                    const SizedBox(width: 8),
                    FilledButton(onPressed: hasChanges ? _save : null, child: const Text('done').tr()),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ReorderableGrid extends StatefulWidget {
  final ScrollController? scrollController;
  final List<ActionButtonType> items;
  final Function(int oldIndex, int newIndex) onReorder;
  final int crossAxisCount;
  final double crossAxisSpacing;
  final double mainAxisSpacing;
  final double childAspectRatio;
  final bool shouldScroll;

  const _ReorderableGrid({
    required this.scrollController,
    required this.items,
    required this.onReorder,
    required this.crossAxisCount,
    required this.crossAxisSpacing,
    required this.mainAxisSpacing,
    required this.childAspectRatio,
    required this.shouldScroll,
  });

  @override
  State<_ReorderableGrid> createState() => _ReorderableGridState();
}

class _ReorderableGridState extends State<_ReorderableGrid> {
  int? _draggingIndex;
  late List<int> _itemOrder;
  int? _lastHoveredIndex;
  bool _snapNow = false;

  @override
  void initState() {
    super.initState();
    _itemOrder = List.generate(widget.items.length, (index) => index);
  }

  @override
  void didUpdateWidget(_ReorderableGrid oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.items.length != widget.items.length) {
      _itemOrder = List.generate(widget.items.length, (index) => index);
    }
  }

  void _updateHover(int draggedIndex, int targetIndex) {
    if (draggedIndex == targetIndex || _draggingIndex == null) return;

    setState(() {
      _lastHoveredIndex = targetIndex;
      // Temporarily reorder for visual feedback
      final newOrder = List<int>.from(_itemOrder);
      final draggedOrderIndex = newOrder.indexOf(draggedIndex);
      final targetOrderIndex = newOrder.indexOf(targetIndex);

      newOrder.removeAt(draggedOrderIndex);
      newOrder.insert(targetOrderIndex, draggedIndex);
      _itemOrder = newOrder;
    });
  }

  void _handleDragEnd(int draggedIndex, int? targetIndex) {
    // Use targetIndex if available, otherwise check if visual position changed
    final effectiveTargetIndex =
        targetIndex ??
        (() {
          final currentVisualIndex = _itemOrder.indexOf(draggedIndex);
          // If visual position changed from original, use the item at current visual position
          if (currentVisualIndex != draggedIndex) {
            return _itemOrder[currentVisualIndex];
          }
          return null;
        })();

    if (effectiveTargetIndex != null && draggedIndex != effectiveTargetIndex) {
      widget.onReorder(draggedIndex, effectiveTargetIndex);
    }

    // Trigger snap animation for all items
    _armSnapNow();

    setState(() {
      _draggingIndex = null;
      _lastHoveredIndex = null;
      _itemOrder = List.generate(widget.items.length, (i) => i);
    });
  }

  void _armSnapNow() {
    setState(() => _snapNow = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() => _snapNow = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final tileWidth =
            (constraints.maxWidth - (widget.crossAxisSpacing * (widget.crossAxisCount - 1))) / widget.crossAxisCount;
        final tileHeight = tileWidth / widget.childAspectRatio;
        final rows = (_itemOrder.length / widget.crossAxisCount).ceil();
        final totalHeight = rows * tileHeight + (rows - 1) * widget.mainAxisSpacing;

        return SingleChildScrollView(
          controller: widget.scrollController,
          physics: widget.shouldScroll ? const BouncingScrollPhysics() : const NeverScrollableScrollPhysics(),
          child: SizedBox(
            width: constraints.maxWidth,
            height: totalHeight,
            child: Stack(
              children: List.generate(widget.items.length, (index) {
                final visualIndex = _itemOrder.indexOf(index);
                final item = widget.items[index];
                final isDragging = _draggingIndex == index;

                // Calculate position
                final row = visualIndex ~/ widget.crossAxisCount;
                final col = visualIndex % widget.crossAxisCount;
                final left = col * (tileWidth + widget.crossAxisSpacing);
                final top = row * (tileHeight + widget.mainAxisSpacing);

                return _AnimatedGridItem(
                  key: ValueKey(index),
                  index: index,
                  item: item,
                  isDragging: isDragging,
                  snapNow: _snapNow,
                  tileWidth: tileWidth,
                  tileHeight: tileHeight,
                  left: left,
                  top: top,
                  onDragStarted: () {
                    setState(() {
                      _draggingIndex = index;
                      _lastHoveredIndex = index;
                    });
                  },
                  onDragUpdate: (draggedIndex, targetIndex) {
                    _updateHover(draggedIndex, targetIndex);
                  },
                  onDragCompleted: (draggedIndex) {
                    _handleDragEnd(draggedIndex, _lastHoveredIndex);
                  },
                );
              }),
            ),
          ),
        );
      },
    );
  }
}

class _AnimatedGridItem extends StatelessWidget {
  final int index;
  final ActionButtonType item;
  final bool isDragging;
  final bool snapNow;
  final double tileWidth;
  final double tileHeight;
  final double left;
  final double top;
  final VoidCallback onDragStarted;
  final Function(int draggedIndex, int targetIndex) onDragUpdate;
  final Function(int draggedIndex) onDragCompleted;

  const _AnimatedGridItem({
    super.key,
    required this.index,
    required this.item,
    required this.isDragging,
    required this.snapNow,
    required this.tileWidth,
    required this.tileHeight,
    required this.left,
    required this.top,
    required this.onDragStarted,
    required this.onDragUpdate,
    required this.onDragCompleted,
  });

  @override
  Widget build(BuildContext context) {
    final Duration animDuration = snapNow ? Duration.zero : const Duration(milliseconds: 150);

    return AnimatedPositioned(
      duration: animDuration,
      curve: Curves.easeInOut,
      left: left,
      top: top,
      width: tileWidth,
      height: tileHeight,
      child: DragTarget<int>(
        onWillAcceptWithDetails: (details) {
          if (details.data != index) {
            onDragUpdate(details.data, index);
          }
          return details.data != index;
        },
        builder: (context, candidateData, rejectedData) {
          Widget child = _QuickActionTile(index: index, type: item);

          if (isDragging) {
            child = Opacity(opacity: 0.0, child: child);
          }

          return Draggable<int>(
            data: index,
            feedback: Material(
              color: Colors.transparent,
              child: SizedBox(
                width: tileWidth,
                height: tileHeight,
                child: Opacity(
                  opacity: 0.9,
                  child: Transform.scale(
                    scale: 1.05,
                    child: _QuickActionTile(index: index, type: item),
                  ),
                ),
              ),
            ),
            childWhenDragging: const SizedBox.shrink(),
            onDragStarted: onDragStarted,
            onDragCompleted: () {
              onDragCompleted(index);
            },
            onDraggableCanceled: (_, __) {
              onDragCompleted(index);
            },
            child: child,
          );
        },
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final int index;
  final ActionButtonType type;

  const _QuickActionTile({required this.index, required this.type});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderColor = theme.dividerColor;
    final backgroundColor = theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.2);
    final indicatorColor = theme.colorScheme.primary;
    final accentColor = theme.colorScheme.onSurface.withValues(alpha: 0.7);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          border: Border.all(color: borderColor),
          color: backgroundColor,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: indicatorColor.withValues(alpha: 0.15),
                    borderRadius: const BorderRadius.all(Radius.circular(12)),
                  ),
                  child: Center(
                    child: Text(
                      '${index + 1}',
                      style: theme.textTheme.labelSmall?.copyWith(color: indicatorColor, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.drag_indicator_rounded, size: 18, color: indicatorColor),
              ],
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.topCenter,
              child: Icon(type.iconData, size: 28, color: theme.colorScheme.onSurface),
            ),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.topCenter,
              child: Text(
                type.localizedLabel(context),
                style: theme.textTheme.labelSmall?.copyWith(color: accentColor),
                textAlign: TextAlign.center,
                maxLines: 3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
