import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/text_button.dart';
import 'package:immich_ui/src/previews.dart';
import 'package:immich_ui/src/types.dart';

void _previewNoop() {}

@ImmichPreview(group: 'TextButton', name: 'Variants')
Widget previewTextButtonVariants() => const Wrap(
  spacing: 12,
  runSpacing: 12,
  children: [
    ImmichTextButton(onPressed: _previewNoop, labelText: 'Filled', expanded: false),
    ImmichTextButton(onPressed: _previewNoop, labelText: 'Ghost', variant: ImmichVariant.ghost, expanded: false),
  ],
);

@ImmichPreview(group: 'TextButton', name: 'With Icons')
Widget previewTextButtonWithIcons() => const Wrap(
  spacing: 12,
  runSpacing: 12,
  children: [
    ImmichTextButton(onPressed: _previewNoop, labelText: 'With Icon', icon: Icons.add, expanded: false),
    ImmichTextButton(
      onPressed: _previewNoop,
      labelText: 'Download',
      icon: Icons.download,
      variant: ImmichVariant.ghost,
      expanded: false,
    ),
  ],
);

@ImmichPreview(group: 'TextButton', name: 'Loading')
Widget previewTextButtonLoading() => ImmichTextButton(
  onPressed: () => Future<void>.delayed(const Duration(seconds: 2)),
  labelText: 'Click me',
  expanded: false,
);

@ImmichPreview(group: 'TextButton', name: 'Disabled')
Widget previewTextButtonDisabled() => const Wrap(
  spacing: 12,
  runSpacing: 12,
  children: [
    ImmichTextButton(onPressed: _previewNoop, labelText: 'Disabled', disabled: true, expanded: false),
    ImmichTextButton(
      onPressed: _previewNoop,
      labelText: 'Disabled Ghost',
      variant: ImmichVariant.ghost,
      disabled: true,
      expanded: false,
    ),
  ],
);
