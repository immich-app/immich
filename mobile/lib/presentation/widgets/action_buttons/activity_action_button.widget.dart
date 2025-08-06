import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/routing/router.dart';

class ActivityActionButton extends StatelessWidget {
  const ActivityActionButton({super.key, this.menuItem = true});

  final bool menuItem;

  @override
  Widget build(BuildContext context) {
    return BaseActionButton(
      iconData: Icons.mode_comment_outlined,
      label: "activity".t(context: context),
      onPressed: () {
        context.pushRoute(const DriftActivitiesRoute());
      },
      menuItem: menuItem,
    );
  }
}
