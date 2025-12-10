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
  int? _hoveringIndex;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      controller: widget.scrollController,
      physics: widget.shouldScroll ? const BouncingScrollPhysics() : const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: widget.crossAxisCount,
        crossAxisSpacing: widget.crossAxisSpacing,
        mainAxisSpacing: widget.mainAxisSpacing,
        childAspectRatio: widget.childAspectRatio,
      ),
      itemCount: widget.items.length,
      itemBuilder: (context, index) {
        final item = widget.items[index];
        final isDragging = _draggingIndex == index;
        final isHovering = _hoveringIndex == index;

        return DragTarget<int>(
          onWillAcceptWithDetails: (details) {
            if (details.data != index) {
              setState(() => _hoveringIndex = index);
            }
            return details.data != index;
          },
          onLeave: (_) {
            setState(() => _hoveringIndex = null);
          },
          onAcceptWithDetails: (details) {
            final oldIndex = details.data;
            if (oldIndex != index) {
              widget.onReorder(oldIndex, index);
            }
            setState(() {
              _hoveringIndex = null;
              _draggingIndex = null;
            });
          },
          builder: (context, candidateData, rejectedData) {
            return LongPressDraggable<int>(
              data: index,
              feedback: Material(
                color: Colors.transparent,
                child: Opacity(
                  opacity: 0.8,
                  child: Transform.scale(
                    scale: 1.1,
                    child: _QuickActionTile(index: index, type: item),
                  ),
                ),
              ),
              childWhenDragging: Opacity(
                opacity: 0.3,
                child: _QuickActionTile(index: index, type: item),
              ),
              onDragStarted: () {
                setState(() => _draggingIndex = index);
              },
              onDragEnd: (_) {
                setState(() => _draggingIndex = null);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                transform: isHovering && !isDragging ? Matrix4.translationValues(0, -4, 0) : Matrix4.identity(),
                child: _QuickActionTile(index: index, type: item),
              ),
            );
          },
        );
      },
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
