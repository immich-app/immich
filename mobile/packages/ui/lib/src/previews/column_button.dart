import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/column_button.dart';
import 'package:immich_ui/src/previews.dart';

void _previewNoop() {}

@ImmichPreview(group: 'ColumnButton', name: 'Default')
Widget previewColumnButtonDefault() => const Wrap(
  spacing: 12,
  runSpacing: 12,
  children: [
    ImmichColumnButton(onPressed: _previewNoop, icon: Icons.favorite_border_rounded, label: 'Favorite'),
    ImmichColumnButton(onPressed: _previewNoop, icon: Icons.archive_outlined, label: 'Archive'),
    ImmichColumnButton(onPressed: _previewNoop, icon: Icons.delete_outline_rounded, label: 'Delete'),
  ],
);

@ImmichPreview(group: 'ColumnButton', name: 'Loading')
Widget previewColumnButtonLoading() => ImmichColumnButton(
  onPressed: () => Future<void>.delayed(const .new(seconds: 2)),
  icon: Icons.download,
  label: 'Download',
);

@ImmichPreview(group: 'ColumnButton', name: 'Disabled')
Widget previewColumnButtonDisabled() =>
    const ImmichColumnButton(onPressed: _previewNoop, icon: Icons.ios_share_rounded, label: 'Share', disabled: true);
