import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// Everything a tab contributes to the single shared `PageChrome`.
///
/// Published per-tab via a `Provider<PageChromeContent>`; the chrome reads the
/// active tab's value (within that tab's scope) and renders it. Data flows
/// downward, so the chrome renders with the active tab's content in the same
/// frame.
class PageChromeContent {
  /// The app bar sliver placed first in the shared scroll view. The tab decides
  /// which bar it wants (e.g. a primary bar, or a selection bar during
  /// multiselect).
  final Widget appBar;

  /// The tab's content slivers, rendered after [appBar].
  final List<Widget> slivers;

  /// Scroll controller for the shared scroll view. Provided by the tab when it
  /// needs custom behaviour (e.g. the timeline's position restore). When `null`,
  /// the chrome creates and owns a default controller.
  final ScrollController? controller;

  /// Optionally decorates the shared scroll view, e.g. wrapping it in the
  /// timeline's `Scrubber`. Receives the built scroll view and returns the
  /// widget to place in the body.
  final Widget Function(CustomScrollView scrollView)? viewportBuilder;

  final Widget? floatingActionButton;

  /// Widgets stacked on top of the scroll view (e.g. bottom sheet, multiselect
  /// status button).
  final List<Widget> overlays;

  final ScrollPhysics? physics;

  /// Forwarded to the shared [CustomScrollView] (e.g. the timeline's larger
  /// cache extent).
  final ScrollCacheExtent? scrollCacheExtent;

  const PageChromeContent({
    required this.appBar,
    this.slivers = const [],
    this.controller,
    this.viewportBuilder,
    this.floatingActionButton,
    this.overlays = const [],
    this.physics,
    this.scrollCacheExtent,
  });
}
