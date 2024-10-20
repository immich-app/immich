import 'package:flutter/material.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ImAppBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: context.theme.appBarTheme.backgroundColor,
      automaticallyImplyLeading: false,
      centerTitle: false,
      title: Text(context.t.immich),
    );
  }
}
