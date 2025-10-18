import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';

class ScrollToBottomEvent extends Event {
  const ScrollToBottomEvent();
}

class BaseBottomSheet extends ConsumerStatefulWidget {
  final List<Widget> actions;
  final DraggableScrollableController? controller;
  final List<Widget>? slivers;
  final Widget? footer;
  // ScrollToBottomEventを監視して内部スクロール末尾スクロールを有効化するか
  final bool listenScrollToBottomEvents;
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
    this.listenScrollToBottomEvents = false,
  }) : minChildSize = minChildSize ?? 0.15;

  @override
  ConsumerState<BaseBottomSheet> createState() => _BaseDraggableScrollableSheetState();
}

class _BaseDraggableScrollableSheetState extends ConsumerState<BaseBottomSheet> {
  late DraggableScrollableController _controller;
  StreamSubscription<ScrollToBottomEvent>? _scrollToBottomSub;
  ScrollController? _innerScrollController;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? DraggableScrollableController();
    if (widget.listenScrollToBottomEvents) {
      _scrollToBottomSub = EventStream.shared.listen<ScrollToBottomEvent>(_onScrollToBottomEvent);
      // ここで初期スクロールを発火
      EventStream.shared.emit(const ScrollToBottomEvent());
    }
  }

  void _onScrollToBottomEvent(ScrollToBottomEvent event) async {
    final scrollController = _innerScrollController;
    if (scrollController == null || !scrollController.hasClients) return;
    // レイアウト確定後に実行（再ビルド直後などmaxScrollExtentが0の場合に対応）
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!scrollController.hasClients) return;
      final maxExtent = scrollController.position.maxScrollExtent;
      if ((maxExtent - scrollController.offset).abs() > 4) {
        // scrollController.jumpTo(maxExtent);

        await scrollController.animateTo(
          maxExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.fastOutSlowIn,
        );
      }
    });
  }

  @override
  void dispose() {
    _scrollToBottomSub?.cancel();
    super.dispose();
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
        _innerScrollController ??= scrollController;
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
                  // // builder内のcontrollerをStateに保持
                  // key: ValueKey(widget.slivers?.length ?? 0),
                  slivers: [
                    const SliverPersistentHeader(delegate: _DragHandleDelegate(), pinned: true),
                    if (widget.actions.isNotEmpty)
                      SliverToBoxAdapter(
                        child: Column(
                          children: [
                            SizedBox(
                              height: 115,
                              child: ListView(
                                shrinkWrap: true,
                                scrollDirection: Axis.horizontal,
                                children: widget.actions,
                              ),
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

class _DragHandleDelegate extends SliverPersistentHeaderDelegate {
  const _DragHandleDelegate();

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return const _DragHandle();
  }

  @override
  bool shouldRebuild(_DragHandleDelegate oldDelegate) => false;

  @override
  double get minExtent => 50.0;

  @override
  double get maxExtent => 50.0;
}

class _DragHandle extends StatelessWidget {
  const _DragHandle();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50,
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
