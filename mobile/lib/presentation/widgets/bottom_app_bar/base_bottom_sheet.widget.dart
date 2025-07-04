import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';

class BaseBottomSheet extends ConsumerStatefulWidget {
  final List<Widget> actions;
  final DraggableScrollableController? controller;
  final List<Widget>? slivers;
  final double initialChildSize;
  final double minChildSize;
  final double maxChildSize;
  final bool expand;
  final bool shouldCloseOnMinExtent;
  final bool resizeOnScroll;

  const BaseBottomSheet({
    super.key,
    required this.actions,
    this.slivers,
    this.controller,
    this.initialChildSize = 0.35,
    this.minChildSize = 0.15,
    this.maxChildSize = 0.65,
    this.expand = true,
    this.shouldCloseOnMinExtent = true,
    this.resizeOnScroll = true,
  });

  @override
  ConsumerState<BaseBottomSheet> createState() =>
      _BaseDraggableScrollableSheetState();
}

class _BaseDraggableScrollableSheetState
    extends ConsumerState<BaseBottomSheet> {
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
          color: context.colorScheme.surfaceContainerHigh,
          surfaceTintColor: context.colorScheme.surfaceContainerHigh,
          borderOnForeground: false,
          clipBehavior: Clip.antiAlias,
          elevation: 6.0,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
          ),
          margin: const EdgeInsets.symmetric(horizontal: 0),
          child: CustomScrollView(
            controller: scrollController,
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    const SizedBox(height: 10),
                    const _DragHandle(),
                    const SizedBox(height: 14),
                    if (widget.actions.isNotEmpty)
                      SizedBox(
                        height: 115,
                        child: ListView(
                          shrinkWrap: true,
                          scrollDirection: Axis.horizontal,
                          children: widget.actions,
                        ),
                      ),
                    if (widget.actions.isNotEmpty) ...[
                      const Divider(indent: 16, endIndent: 16),
                      const SizedBox(height: 16),
                    ],
                  ],
                ),
              ),
              ...(widget.slivers ?? []),
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
    return Container(
      height: 6,
      width: 32,
      decoration: BoxDecoration(
        color: context.themeData.dividerColor.lighten(amount: 0.6),
        borderRadius: const BorderRadius.all(Radius.circular(20)),
      ),
    );
  }
}
