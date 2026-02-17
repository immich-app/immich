import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';

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
    this.backgroundColor,
  }) : minChildSize = minChildSize ?? 0.15;

  @override
  ConsumerState<BaseBottomSheet> createState() => _BaseDraggableScrollableSheetState();
}

class _BaseDraggableScrollableSheetState extends ConsumerState<BaseBottomSheet> {
  late DraggableScrollableController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? DraggableScrollableController();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(timelineStateProvider, (previous, next) {
      if (!widget.resizeOnScroll) {
        return;
      }

      if (previous?.isInteracting != true && next.isInteracting) {
        _controller.animateTo(
          widget.minChildSize,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
        );
      }
    });

    return DraggableScrollableSheet(
      controller: _controller,
      initialChildSize: widget.initialChildSize,
      minChildSize: widget.minChildSize,
      maxChildSize: widget.maxChildSize,
      snap: false,
      expand: widget.expand,
      shouldCloseOnMinExtent: widget.shouldCloseOnMinExtent,
      builder: (BuildContext context, ScrollController scrollController) {
        return Card(
          color: widget.backgroundColor ?? context.colorScheme.surfaceContainer,
          elevation: 3.0,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
          margin: const EdgeInsets.symmetric(horizontal: 0),
          child: Column(
            children: [
              Expanded(
                child: CustomScrollView(
                  controller: scrollController,
                  slivers: [
                    const SliverToBoxAdapter(child: _DragHandle()),
                    if (widget.actions.isNotEmpty)
                      SliverToBoxAdapter(
                        child: Column(
                          children: [
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: widget.actions),
                            ),
                            const Divider(indent: 16, endIndent: 16),
                            const SizedBox(height: 16),
                          ],
                        ),
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
