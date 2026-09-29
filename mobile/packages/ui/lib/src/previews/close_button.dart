import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/close_button.dart';
import 'package:immich_ui/src/previews.dart';
import 'package:immich_ui/src/types.dart';

void _previewNoop() {}

@ImmichPreview(group: 'CloseButton', name: 'Variants')
Widget previewCloseButtonVariants() => const Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        ImmichCloseButton(onPressed: _previewNoop),
        ImmichCloseButton(onPressed: _previewNoop, variant: ImmichVariant.filled),
      ],
    );

@ImmichPreview(group: 'CloseButton', name: 'Colors')
Widget previewCloseButtonColors() => const Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        ImmichCloseButton(onPressed: _previewNoop),
        ImmichCloseButton(onPressed: _previewNoop, color: ImmichColor.secondary),
      ],
    );
