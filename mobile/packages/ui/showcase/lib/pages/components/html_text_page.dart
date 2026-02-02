import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class HtmlTextPage extends StatelessWidget {
  const HtmlTextPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.htmlText.name,
      child: ComponentExamples(
        title: 'ImmichHtmlText',
        subtitle: 'Render text with HTML formatting (bold, links).',
        examples: [
          ExampleCard(
            title: 'Bold Text',
            preview: ImmichHtmlText(
              'This is <b>bold text</b> and <strong>strong text</strong>.',
            ),
            code: '''ImmichHtmlText(
  'This is <b>bold text</b> and <strong>strong text</strong>.',
)''',
          ),
          ExampleCard(
            title: 'Links',
            preview: ImmichHtmlText(
              'Read the <docs-link>documentation</docs-link> or visit <github-link>GitHub</github-link>.',
              linkHandlers: {
                'docs-link': () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Docs link clicked!')),
                  );
                },
                'github-link': () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('GitHub link clicked!')),
                  );
                },
              },
            ),
            code: '''ImmichHtmlText(
  'Read the <docs-link>documentation</docs-link>.',
  linkHandlers: {
    'docs-link': () => launchUrl(docsUrl),
  },
)''',
          ),
          ExampleCard(
            title: 'Nested Tags',
            preview: ImmichHtmlText(
              'You can <b>combine <link>bold and links</link></b> together.',
              linkHandlers: {
                'link': () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Nested link clicked!')),
                  );
                },
              },
            ),
            code: '''ImmichHtmlText(
  'You can <b>combine <link>bold and links</link></b>.',
  linkHandlers: {
    'link': () => handleClick(),
  },
)''',
          ),
        ],
      ),
    );
  }
}
