import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/icon_button.dart';
import 'package:immich_ui/src/previews.dart';
import 'package:immich_ui/src/types.dart';

void _previewNoop() {}

@ImmichPreview(group: 'IconButton', name: 'Variants')
Widget previewIconButtonVariants() => const Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        ImmichIconButton(icon: Icons.add, onPressed: _previewNoop),
        ImmichIconButton(icon: Icons.edit, onPressed: _previewNoop, variant: ImmichVariant.ghost),
      ],
    );

@ImmichPreview(group: 'IconButton', name: 'Colors')
Widget previewIconButtonColors() => const Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        ImmichIconButton(icon: Icons.favorite, onPressed: _previewNoop),
        ImmichIconButton(icon: Icons.delete, onPressed: _previewNoop, color: ImmichColor.secondary),
      ],
    );

@ImmichPreview(group: 'IconButton', name: 'Disabled')
Widget previewIconButtonDisabled() => const Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        ImmichIconButton(icon: Icons.settings, onPressed: _previewNoop, disabled: true),
        ImmichIconButton(
          icon: Icons.settings,
          onPressed: _previewNoop,
          disabled: true,
          variant: ImmichVariant.ghost,
        ),
      ],
    );
