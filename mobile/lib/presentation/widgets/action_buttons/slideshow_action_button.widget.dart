import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class SlideshowActionButton extends ConsumerWidget {
  final bool iconOnly;
  final bool menuItem;

  const SlideshowActionButton({super.key, this.iconOnly = false, this.menuItem = false});

  Future<void> _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    await context.pushRoute(DriftSlideshowRoute(timeline: ref.read(timelineServiceProvider)));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.slideshow,
      label: "slideshow".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => unawaited(_onTap(context, ref)),
      maxWidth: 100,
    );
  }
}
