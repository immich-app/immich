import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_scaffold_body.widget.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImAdaptiveRouteWrapper extends StatelessWidget {
  const ImAdaptiveRouteWrapper({
    super.key,
    required this.primaryRoute,
    required this.primaryBody,
    this.bodyRatio,
  });

  /// Builder to build the primary body
  final Widget Function(BuildContext?) primaryBody;

  /// Primary route name to not render it twice in landscape
  final String primaryRoute;

  /// Ratio of primaryBody:secondaryBody
  final double? bodyRatio;

  @override
  Widget build(BuildContext context) {
    return AutoRouter(builder: (ctx, child) {
      if (ctx.isTablet) {
        return ImAdaptiveScaffoldBody(
          primaryBody: primaryBody,
          secondaryBody:
              ctx.topRoute.name != primaryRoute ? (_) => child : null,
          bodyRatio: bodyRatio,
        );
      }
      return ImAdaptiveScaffoldBody(primaryBody: (_) => child);
    });
  }
}
