import 'package:flutter/material.dart';
import 'package:flutter_adaptive_scaffold/flutter_adaptive_scaffold.dart';

class ImAdaptiveScaffoldBody extends StatelessWidget {
  const ImAdaptiveScaffoldBody({
    super.key,
    required this.primaryBody,
    this.secondaryBody,
    this.bodyRatio,
  });

  /// Builder to build the primary body
  final Widget Function(BuildContext?) primaryBody;

  /// Builder to build the secondary body
  final Widget Function(BuildContext?)? secondaryBody;

  /// Ratio of primaryBody:secondaryBody
  final double? bodyRatio;

  @override
  Widget build(BuildContext context) {
    return AdaptiveLayout(
      body: SlotLayout(
        config: {
          Breakpoints.standard: SlotLayout.from(
            builder: primaryBody,
            key: const Key('ImAdaptiveScaffold Body Standard'),
          ),
        },
      ),
      secondaryBody: SlotLayout(
        config: {
          /// No secondary body in mobile layouts
          Breakpoints.small: SlotLayoutConfig.empty(),
          Breakpoints.mediumAndUp: SlotLayout.from(
            builder: secondaryBody,
            key: const Key('ImAdaptiveScaffold Secondary Body Medium'),
          ),
        },
      ),
      bodyRatio: bodyRatio,
      transitionDuration: Durations.medium2,
      internalAnimations: false,
    );
  }
}
