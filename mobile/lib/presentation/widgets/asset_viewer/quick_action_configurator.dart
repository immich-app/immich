import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_reorderable_grid_view/widgets/reorderable_builder.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/viewer_quick_action_order.provider.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';
import 'package:immich_mobile/utils/action_button_visuals.dart';

class ViewerQuickActionConfigurator extends ConsumerStatefulWidget {
  const ViewerQuickActionConfigurator({super.key});

  @override
  ConsumerState<ViewerQuickActionConfigurator> createState() => _ViewerQuickActionConfiguratorState();
}

class _ViewerQuickActionConfiguratorState extends ConsumerState<ViewerQuickActionConfigurator> {
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

  void _onReorder(ReorderedListFunction<ActionButtonType> reorder) {
    setState(() {
      _order = reorder(_order);
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
    final normalized = ActionButtonBuilder.normalizeQuickActionOrder(_order);

    await ref.read(viewerQuickActionOrderProvider.notifier).setOrder(normalized);
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
    final normalizedSelection = ActionButtonBuilder.normalizeQuickActionOrder(_order);
    final hasChanges = !listEquals(currentOrder, normalizedSelection);

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
                  final horizontalPadding = 8.0; // matches GridView padding
                  final tileWidth =
                      (constraints.maxWidth - horizontalPadding - (crossAxisSpacing * (crossAxisCount - 1))) /
                      crossAxisCount;
                  final childAspectRatio = tileWidth / tileHeight;
                  final gridController = shouldScroll ? _scrollController : null;

                  return ReorderableBuilder<ActionButtonType>(
                    onReorder: _onReorder,
                    enableLongPress: false,
                    scrollController: gridController,
                    children: [
                      for (var i = 0; i < _order.length; i++)
                        _QuickActionTile(key: ValueKey(_order[i].name), index: i, type: _order[i]),
                    ],
                    builder: (children) => GridView.count(
                      controller: gridController,
                      crossAxisCount: crossAxisCount,
                      crossAxisSpacing: crossAxisSpacing,
                      mainAxisSpacing: mainAxisSpacing,
                      // padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
                      physics: shouldScroll ? const BouncingScrollPhysics() : const NeverScrollableScrollPhysics(),
                      childAspectRatio: childAspectRatio,
                      children: children,
                    ),
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

class _QuickActionTile extends StatelessWidget {
  final int index;
  final ActionButtonType type;

  const _QuickActionTile({super.key, required this.index, required this.type});

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
