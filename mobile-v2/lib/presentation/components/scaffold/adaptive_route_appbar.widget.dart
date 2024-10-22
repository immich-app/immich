import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImAdaptiveRouteAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  final String? title;
  final bool isPrimary;

  /// Passed to [AppBar] actions
  final List<Widget>? actions;

  const ImAdaptiveRouteAppBar({
    super.key,
    this.title,
    this.isPrimary = true,
    this.actions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final Widget leading;
    if (isPrimary) {
      leading = BackButton(
        onPressed: () => unawaited(context.router.root.maybePop()),
      );
    } else {
      leading = context.isTablet
          ? CloseButton(onPressed: () => unawaited(context.maybePop()))
          : BackButton(onPressed: () => unawaited(context.maybePop()));
    }

    return AppBar(
      leading: leading,
      title: title == null ? null : Text(title!),
      actions: actions,
    );
  }
}
