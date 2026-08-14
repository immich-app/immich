import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/menu_item.dart';
import 'package:immich_ui/src/previews.dart';

void _previewNoop() {}

@ImmichPreview(group: 'MenuItem', name: 'Default')
Widget previewMenuItemDefault() => const Column(
  mainAxisSize: MainAxisSize.min,
  children: [
    ImmichMenuItem(onPressed: _previewNoop, icon: Icons.info_outline, label: 'Info'),
    ImmichMenuItem(onPressed: _previewNoop, icon: Icons.help_outline_rounded, label: 'Troubleshoot'),
    ImmichMenuItem(onPressed: _previewNoop, icon: Icons.cast_rounded, label: 'Cast'),
  ],
);

@ImmichPreview(group: 'MenuItem', name: 'Disabled')
Widget previewMenuItemDisabled() =>
    const ImmichMenuItem(onPressed: _previewNoop, icon: Icons.delete_outline_rounded, label: 'Delete', disabled: true);
