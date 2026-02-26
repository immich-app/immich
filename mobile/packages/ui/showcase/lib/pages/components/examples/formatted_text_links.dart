import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

class FormattedTextLinks extends StatelessWidget {
  const FormattedTextLinks({super.key});

  @override
  Widget build(BuildContext context) {
    return ImmichFormattedText(
      'Read the <docs-link>documentation</docs-link> or visit <github-link>GitHub</github-link>.',
      spanBuilder: (tag) => FormattedSpan(
        onTap: switch (tag) {
          'docs-link' => () => ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Docs link clicked!'))),
          'github-link' => () => ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('GitHub link clicked!'))),
          _ => null,
        },
      ),
    );
  }
}
