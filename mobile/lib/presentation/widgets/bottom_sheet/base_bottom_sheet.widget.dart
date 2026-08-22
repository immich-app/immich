import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/widgets/common/measured_size.dart';

class BaseBottomSheet extends ConsumerStatefulWidget {
  final List<Widget> actions;
  final DraggableScrollableController? controller;
  final List<Widget>? slivers;
  final Widget? footer;
  final double initialChildSize;
  final double minChildSize;
  final double maxChildSize;
  final bool expand;
  final bool shouldCloseOnMinExtent;
  final bool resizeOnScroll;

  /// When true, the sheet's resting (minimum) size is derived from the
  /// measured height of its header (drag handle and actions) instead of
  /// [minChildSize], and that height is reported to [timelineStateProvider]
  /// so the timeline grid can pad its content to stay visible above the sheet
  final bool sizeToContent;
  final Color? backgroundColor;

  const BaseBottomSheet({
    super.key,
    required this.actions,
    this.slivers,
    this.footer,
    this.controller,
    this.initialChildSize = 0.35,
    double? minChildSize,
    this.maxChildSize = 0.65,
    this.expand = true,
    this.shouldCloseOnMinExtent = true,
    this.resizeOnScroll = true,
    this.sizeToContent = true,
    this.backgroundColor,
  }) : minChildSize = minChildSize ?? 0.15;

  @override
  ConsumerState<BaseBottomSheet> createState() => _BaseDraggableScrollableSheetState();
}

class _BaseDraggableScrollableSheetState extends ConsumerState<BaseBottomSheet> {
  late DraggableScrollableController _controller;
  late TimelineStateNotifier _timelineStateNotifier;
  double? _restingHeight;
  double _availableHeight = 0;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? DraggableScrollableController();
    _timelineStateNotifier = ref.read(timelineStateProvider.notifier);
  }

  @override
  void dispose() {
    if (widget.sizeToContent) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _timelineStateNotifier.setBottomSheetHeight(0));
    }
    super.dispose();
  }

  double get _minChildSize {
    if (!widget.sizeToContent || _restingHeight == null || _availableHeight <= 0) {
      return widget.minChildSize;
    }
    return (_restingHeight! / _availableHeight).clamp(0.0, widget.maxChildSize);
  }

  void _onHeaderSizeChanged(Size size) {
    if (!mounted) {
      return;
    }

    final restingHeight = size.height + MediaQuery.paddingOf(context).bottom;
    if (_restingHeight == restingHeight) {
      return;
    }

    final wasResting = _controller.isAttached && _controller.size <= _minChildSize + 0.001;
    setState(() => _restingHeight = restingHeight);
    _timelineStateNotifier.setBottomSheetHeight(restingHeight);
    // Settle the sheet onto the new resting size if it was resting at the old one
    if (wasResting) {
      _controller.jumpTo(_minChildSize);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(timelineStateProvider, (previous, next) {
      if (!widget.resizeOnScroll) {
        return;
      }

      if (previous?.isInteracting != true && next.isInteracting) {
        unawaited(
          _controller.animateTo(_minChildSize, duration: const Duration(milliseconds: 200), curve: Curves.easeInOut),
        );
      }
    });

    final header = Column(
      children: [
        const _DragHandle(),
        if (widget.actions.isNotEmpty) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: widget.actions),
          ),
          const Divider(indent: 16, endIndent: 16),
          const SizedBox(height: 16),
        ],
      ],
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        _availableHeight = constraints.maxHeight;
        final minChildSize = _minChildSize;

        return DraggableScrollableSheet(
          controller: _controller,
          initialChildSize: widget.initialChildSize.clamp(minChildSize, widget.maxChildSize),
          minChildSize: minChildSize,
          maxChildSize: widget.maxChildSize,
          snap: false,
          expand: widget.expand,
          shouldCloseOnMinExtent: widget.shouldCloseOnMinExtent,
          builder: (BuildContext context, ScrollController scrollController) {
            return Card(
              color: widget.backgroundColor ?? context.colorScheme.surfaceContainer,
              elevation: 3.0,
              shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
              margin: EdgeInsets.zero,
              child: Column(
                children: [
                  Expanded(
                    child: CustomScrollView(
                      controller: scrollController,
                      slivers: [
                        SliverToBoxAdapter(
                          child: widget.sizeToContent
                              ? MeasuredSize(onSizeChanged: _onHeaderSizeChanged, child: header)
                              : header,
                        ),
                        if (widget.slivers != null) ...widget.slivers!,
                      ],
                    ),
                  ),
                  if (widget.footer != null) widget.footer!,
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _DragHandle extends StatelessWidget {
  const _DragHandle();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: Center(
        child: SizedBox(
          width: 32,
          height: 6,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(20)),
              color: context.themeData.dividerColor.lighten(amount: 0.6),
            ),
          ),
        ),
      ),
    );
  }
}
