import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/formatted_text.dart';
import 'package:immich_ui/src/previews.dart';

@ImmichPreview(group: 'FormattedText', name: 'Bold')
Widget previewFormattedTextBold() => const ImmichFormattedText('This is <b>bold text</b>.');

@ImmichPreview(group: 'FormattedText', name: 'Links')
Widget previewFormattedTextLinks() => const _PreviewFormattedTextLinks();

@ImmichPreview(group: 'FormattedText', name: 'Mixed Content')
Widget previewFormattedTextMixed() => const _PreviewFormattedTextMixed();

class _PreviewFormattedTextLinks extends StatelessWidget {
  const _PreviewFormattedTextLinks();

  @override
  Widget build(BuildContext context) {
    return ImmichFormattedText(
      'Read the <docs-link>documentation</docs-link> or visit <github-link>GitHub</github-link>.',
      spanBuilder: (tag) => FormattedSpan(
        onTap: switch (tag) {
          'docs-link' =>
            () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Docs link clicked!'))),
          'github-link' =>
            () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('GitHub link clicked!'))),
          _ => null,
        },
      ),
    );
  }
}

class _PreviewFormattedTextMixed extends StatelessWidget {
  const _PreviewFormattedTextMixed();

  @override
  Widget build(BuildContext context) {
    return ImmichFormattedText(
      'You can use <b>bold text</b> and <link>links</link> together.',
      spanBuilder: (tag) => switch (tag) {
        'b' => const FormattedSpan(style: TextStyle(fontWeight: FontWeight.bold)),
        _ => FormattedSpan(
            onTap: () =>
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link clicked!'))),
          ),
      },
    );
  }
}
