import 'package:flutter/material.dart';
import 'package:immich_ui/src/types.dart';

import 'icon_button.dart';

class ImmichCloseButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final ImmichVariant variant;
  final ImmichColor color;

  const ImmichCloseButton({
    super.key,
    this.onPressed,
    this.color = ImmichColor.primary,
    this.variant = ImmichVariant.ghost,
  });

  @override
  Widget build(BuildContext context) => ImmichIconButton(
        key: key,
        icon: Icons.close,
        color: color,
        variant: variant,
        onPressed: onPressed ?? () => Navigator.of(context).pop(),
      );
}
