import 'package:flutter/material.dart';
import 'package:immich_ui/src/previews.dart';
import 'package:snapshot_test/snapshot_test.dart';

const _appFontFamily = 'GoogleSans';

/// The inset applied around each preview
const _previewPadding = 16.0;

/// Declares one snapshot test per brightness (theme) for [subject], rendering [build] like a preview
///
/// Creates `images/<subject>.<theme>.png`, cropped to the preview's own size
void previewSnapshotTest(String subject, Widget Function() build) =>
    snapshotTest(
      subject,
      build: build,
      theme: (context, _, subject) => immichPreviewTheme().apply(
        context,
        _withAppFont(immichPreviewWrapper(subject)),
      ),
      cropPadding: _previewPadding,
    );

Widget _withAppFont(Widget child) => Builder(
  builder: (context) {
    final theme = Theme.of(context);

    return Theme(
      data: theme.copyWith(
        textTheme: theme.textTheme.apply(fontFamily: _appFontFamily),
      ),
      child: child,
    );
  },
);
