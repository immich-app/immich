import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';

class HtmlTextNestedTags extends StatelessWidget {
  const HtmlTextNestedTags({super.key});

  @override
  Widget build(BuildContext context) {
    return ImmichHtmlText(
      'You can <b>combine <link>bold and links</link></b> together.',
      linkHandlers: {
        'link': () {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Nested link clicked!')));
        },
      },
    );
  }
}
