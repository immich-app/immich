import 'package:flutter/material.dart';

/// A callback that is called when items are reordered.
/// [oldIndex] is the original index of the item being moved.
/// [newIndex] is the target index where the item should be moved to.
typedef ReorderCallback = void Function(int oldIndex, int newIndex);

/// A callback that is called during drag to update hover state.
/// [draggedIndex] is the index of the item being dragged.
/// [targetIndex] is the index of the item being hovered over.
typedef DragUpdateCallback = void Function(int draggedIndex, int targetIndex);

/// A reorderable grid that supports drag and drop reordering with smooth animations.
///
/// This widget provides a drag-and-drop interface for reordering items in a grid layout.
/// Items can be dragged to new positions, and the grid will animate smoothly to reflect
/// the new order.
///
/// Features:
/// - Smooth animations during drag and drop
/// - Instant snap animation on drop completion
/// - Visual feedback during dragging
/// - Customizable grid layout parameters
class ReorderableDragDropGrid extends StatefulWidget {
  /// Controller for scrolling the grid.
  final ScrollController? scrollController;

  /// The number of items to display.
  final int itemCount;

  /// Builder function to create each grid item.
  final Widget Function(BuildContext context, int index) itemBuilder;

  /// Callback when items are reordered.
  final ReorderCallback onReorder;

  /// Number of columns in the grid.
  final int crossAxisCount;

  /// Horizontal spacing between grid items.
  final double crossAxisSpacing;

  /// Vertical spacing between grid items.
  final double mainAxisSpacing;

  /// The ratio of width to height for each grid item.
  final double childAspectRatio;

  /// Whether the grid should be scrollable.
  final bool shouldScroll;

  /// Scale factor for the dragged item feedback widget.
  final double feedbackScaleFactor;

  /// Opacity for the dragged item feedback widget.
  final double feedbackOpacity;

  const ReorderableDragDropGrid({
    super.key,
    this.scrollController,
    required this.itemCount,
    required this.itemBuilder,
    required this.onReorder,
    required this.crossAxisCount,
    required this.crossAxisSpacing,
    required this.mainAxisSpacing,
    required this.childAspectRatio,
    this.shouldScroll = true,
    this.feedbackScaleFactor = 1.05,
    this.feedbackOpacity = 0.9,
  });

  @override
  State<ReorderableDragDropGrid> createState() => _ReorderableDragDropGridState();
}

class _ReorderableDragDropGridState extends State<ReorderableDragDropGrid> {
  int? _draggingIndex;
  late List<int> _itemOrder;
  int? _lastHoveredIndex;
  bool _snapNow = false;

  @override
  void initState() {
    super.initState();
    _itemOrder = List.generate(widget.itemCount, (index) => index);
  }

  @override
  void didUpdateWidget(ReorderableDragDropGrid oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.itemCount != widget.itemCount) {
      _itemOrder = List.generate(widget.itemCount, (index) => index);
    }
  }

  void _updateHover(int draggedIndex, int targetIndex) {
    if (draggedIndex == targetIndex || _draggingIndex == null) return;

    setState(() {
      _lastHoveredIndex = targetIndex;
      final newOrder = List<int>.from(_itemOrder);
      final draggedOrderIndex = newOrder.indexOf(draggedIndex);
      final targetOrderIndex = newOrder.indexOf(targetIndex);

      newOrder.removeAt(draggedOrderIndex);
      newOrder.insert(targetOrderIndex, draggedIndex);
      _itemOrder = newOrder;
    });
  }

  void _handleDragEnd(int draggedIndex, int? targetIndex) {
    final effectiveTargetIndex =
        targetIndex ??
        (() {
          final currentVisualIndex = _itemOrder.indexOf(draggedIndex);
          if (currentVisualIndex != draggedIndex) {
            return _itemOrder[currentVisualIndex];
          }
          return null;
        })();

    if (effectiveTargetIndex != null && draggedIndex != effectiveTargetIndex) {
      widget.onReorder(draggedIndex, effectiveTargetIndex);
    }

    _armSnapNow();

    setState(() {
      _draggingIndex = null;
      _lastHoveredIndex = null;
      _itemOrder = List.generate(widget.itemCount, (i) => i);
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
              children: List.generate(widget.itemCount, (index) {
                final visualIndex = _itemOrder.indexOf(index);
                final isDragging = _draggingIndex == index;

                final row = visualIndex ~/ widget.crossAxisCount;
                final col = visualIndex % widget.crossAxisCount;
                final left = col * (tileWidth + widget.crossAxisSpacing);
                final top = row * (tileHeight + widget.mainAxisSpacing);

                return _AnimatedGridItem(
                  key: ValueKey(index),
                  index: index,
                  isDragging: isDragging,
                  snapNow: _snapNow,
                  tileWidth: tileWidth,
                  tileHeight: tileHeight,
                  left: left,
                  top: top,
                  feedbackScaleFactor: widget.feedbackScaleFactor,
                  feedbackOpacity: widget.feedbackOpacity,
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
                  child: widget.itemBuilder(context, index),
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
  final bool isDragging;
  final bool snapNow;
  final double tileWidth;
  final double tileHeight;
  final double left;
  final double top;
  final double feedbackScaleFactor;
  final double feedbackOpacity;
  final VoidCallback onDragStarted;
  final DragUpdateCallback onDragUpdate;
  final Function(int draggedIndex) onDragCompleted;
  final Widget child;

  const _AnimatedGridItem({
    super.key,
    required this.index,
    required this.isDragging,
    required this.snapNow,
    required this.tileWidth,
    required this.tileHeight,
    required this.left,
    required this.top,
    required this.feedbackScaleFactor,
    required this.feedbackOpacity,
    required this.onDragStarted,
    required this.onDragUpdate,
    required this.onDragCompleted,
    required this.child,
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
          Widget displayChild = child;

          if (isDragging) {
            displayChild = Opacity(opacity: 0.0, child: child);
          }

          return Draggable<int>(
            data: index,
            feedback: Material(
              color: Colors.transparent,
              child: SizedBox(
                width: tileWidth,
                height: tileHeight,
                child: Opacity(
                  opacity: feedbackOpacity,
                  child: Transform.scale(scale: feedbackScaleFactor, child: child),
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
            child: displayChild,
          );
        },
      ),
    );
  }
}
