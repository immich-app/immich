import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

class HtmlTextLinks extends StatelessWidget {
  const HtmlTextLinks({super.key});

  @override
  Widget build(BuildContext context) {
    return ImmichHtmlText(
      'Read the <docs-link>documentation</docs-link> or visit <github-link>GitHub</github-link>.',
      linkHandlers: {
        'docs-link': () {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Docs link clicked!')));
        },
        'github-link': () {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('GitHub link clicked!')));
        },
      },
    );
  }
}
