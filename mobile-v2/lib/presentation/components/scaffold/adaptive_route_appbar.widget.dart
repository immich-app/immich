import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImAdaptiveRoutePrimaryAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  const ImAdaptiveRoutePrimaryAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      leading: BackButton(onPressed: () => context.router.root.maybePop()),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

// ignore: prefer-single-widget-per-file
class ImAdaptiveRouteSecondaryAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  const ImAdaptiveRouteSecondaryAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      leading: context.isTablet
          ? CloseButton(onPressed: () => context.maybePop())
          : BackButton(onPressed: () => context.maybePop()),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
