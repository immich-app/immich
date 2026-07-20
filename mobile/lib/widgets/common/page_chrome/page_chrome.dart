import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/widgets/common/page_chrome/types.dart';

/// The shared page chrome. Authored once; tabs never instantiate it directly
/// (they extend `TabPage`, whose `build` renders this beneath the tab's scope).
///
/// Owns the [Scaffold], the single [CustomScrollView] and its
/// [PrimaryScrollController]. Reads the active tab's [PageChromeContent] from
/// [content] (available in the same frame, since this is a descendant of the
/// tab's scope) and renders its app bar + content slivers.
class PageChrome extends ConsumerStatefulWidget {
  final ProviderListenable<PageChromeContent> content;

  const PageChrome({super.key, required this.content});

  @override
  ConsumerState<PageChrome> createState() => _PageChromeState();
}

class _PageChromeState extends ConsumerState<PageChrome> {
  ScrollController? _ownController;

  @override
  void dispose() {
    _ownController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final content = ref.watch(widget.content);

    // The tab's controller, or a chrome-owned default created lazily.
    final controller = content.controller ?? (_ownController ??= ScrollController());

    final scrollView = CustomScrollView(
      controller: controller,
      physics: content.physics,
      scrollCacheExtent: content.scrollCacheExtent,
      slivers: [content.appBar, ...content.slivers],
    );

    Widget body = content.viewportBuilder != null ? content.viewportBuilder!(scrollView) : scrollView;

    if (content.overlays.isNotEmpty) {
      body = Stack(clipBehavior: Clip.none, children: [body, ...content.overlays]);
    }

    body = Scaffold(
      // Removes the built-in Scaffold `handleStatusBarTap`, avoiding duplicate
      // events when a tab (e.g. the timeline) provides its own.
      primary: false,
      resizeToAvoidBottomInset: false,
      floatingActionButton: content.floatingActionButton,
      body: body,
    );

    // The chrome owns the single scroll view; mark its controller primary so
    // the scrubber's `PrimaryScrollController.of` and iOS status-bar-tap both
    // resolve it. Wrapping the Scaffold preserves status-bar-tap resolution.
    return PrimaryScrollController(controller: controller, child: body);
  }
}
