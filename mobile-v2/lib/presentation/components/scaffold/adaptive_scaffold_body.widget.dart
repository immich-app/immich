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
      internalAnimations: false,
      transitionDuration: const Duration(milliseconds: 300),
      bodyRatio: bodyRatio,
      body: SlotLayout(
        config: {
          Breakpoints.standard: SlotLayout.from(
            key: const Key('ImAdaptiveScaffold Body Standard'),
            builder: primaryBody,
          ),
        },
      ),
      secondaryBody: SlotLayout(
        config: {
          /// No secondary body in mobile layouts
          Breakpoints.small: SlotLayoutConfig.empty(),
          Breakpoints.mediumAndUp: SlotLayout.from(
            key: const Key('ImAdaptiveScaffold Secondary Body Medium'),
            builder: secondaryBody,
          ),
        },
      ),
    );
  }
}
