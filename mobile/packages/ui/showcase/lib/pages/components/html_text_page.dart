import 'package:flutter/material.dart';
import 'package:showcase/pages/components/examples/html_text_bold_text.dart';
import 'package:showcase/pages/components/examples/html_text_links.dart';
import 'package:showcase/pages/components/examples/html_text_nested_tags.dart';
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
            preview: const HtmlTextBoldText(),
            code: 'html_text_bold_text.dart',
          ),
          ExampleCard(
            title: 'Links',
            preview: const HtmlTextLinks(),
            code: 'html_text_links.dart',
          ),
          ExampleCard(
            title: 'Nested Tags',
            preview: const HtmlTextNestedTags(),
            code: 'html_text_nested_tags.dart',
          ),
        ],
      ),
    );
  }
}
