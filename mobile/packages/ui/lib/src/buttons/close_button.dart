import 'package:flutter/material.dart';
import 'package:immich_ui/src/buttons/icon_button.dart';
import 'package:immich_ui/src/types.dart';

class ImmichCloseButton extends StatelessWidget {
  final VoidCallback? onTap;
  final ImmichVariant variant;
  final ImmichColor color;

  const ImmichCloseButton({
    super.key,
    this.onTap,
    this.color = ImmichColor.primary,
    this.variant = ImmichVariant.ghost,
  });

  @override
  Widget build(BuildContext context) => ImmichIconButton(
        key: key,
        icon: Icons.close,
        color: color,
        variant: variant,
        onTap: onTap ?? () => Navigator.of(context).pop(),
      );
}
