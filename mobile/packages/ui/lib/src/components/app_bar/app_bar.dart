import 'package:flutter/material.dart';
import 'package:immich_ui/src/constants.dart';

/// A generic, domain-free sliver app bar primitive.
///
/// It only handles layout, theming and the optional dim animation. Callers are
/// responsible for supplying the [title], [leading] and [actions] widgets.
class ImmichSliverAppBar extends StatelessWidget {
  final Widget? title;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final List<Widget> actions;
  final bool floating;
  final bool pinned;
  final bool snap;
  final double? expandedHeight;

  /// When `true`, the bar fades out and stops receiving pointer events.
  final bool dimmed;

  const ImmichSliverAppBar({
    super.key,
    this.title,
    this.leading,
    this.automaticallyImplyLeading = false,
    this.actions = const [],
    this.floating = true,
    this.pinned = false,
    this.snap = true,
    this.expandedHeight,
    this.dimmed = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SliverIgnorePointer(
      ignoring: dimmed,
      sliver: SliverAnimatedOpacity(
        duration: ImmichDuration.moderate,
        opacity: dimmed ? 0 : 1,
        sliver: SliverAppBar(
          backgroundColor: colorScheme.surface,
          surfaceTintColor: colorScheme.surfaceTint,
          elevation: ImmichElevation.none,
          scrolledUnderElevation: ImmichElevation.xs,
          floating: floating,
          pinned: pinned,
          snap: snap,
          expandedHeight: expandedHeight,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(bottom: Radius.circular(5))),
          automaticallyImplyLeading: automaticallyImplyLeading,
          leading: leading,
          centerTitle: false,
          title: title,
          actions: actions,
        ),
      ),
    );
  }
}
