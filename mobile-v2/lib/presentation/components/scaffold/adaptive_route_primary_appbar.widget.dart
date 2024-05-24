import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

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
