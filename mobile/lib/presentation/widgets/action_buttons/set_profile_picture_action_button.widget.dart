import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/routing/router.dart';

class SetProfilePictureActionButton extends ConsumerWidget {
  final BaseAsset asset;
  final bool iconOnly;
  final bool menuItem;

  const SetProfilePictureActionButton({super.key, required this.asset, this.iconOnly = false, this.menuItem = false});

  void _onTap(BuildContext context) {
    if (!context.mounted) {
      return;
    }

    context.pushRoute(ProfilePictureCropRoute(asset: asset));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.account_circle_outlined,
      label: "set_as_profile_picture".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context),
      maxWidth: 100,
    );
  }
}
