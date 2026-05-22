import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

class FormattedTextMixedContent extends StatelessWidget {
  const FormattedTextMixedContent({super.key});

  @override
  Widget build(BuildContext context) {
    return ImmichFormattedText(
      'You can use <b>bold text</b> and <link>links</link> together.',
      spanBuilder: (tag) => switch (tag) {
        'b' => const FormattedSpan(
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        _ => FormattedSpan(
          onTap: () => ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Link clicked!'))),
        ),
      },
    );
  }
}
