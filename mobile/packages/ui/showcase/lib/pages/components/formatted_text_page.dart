import 'package:flutter/material.dart';
import 'package:showcase/pages/components/examples/formatted_text_bold_text.dart';
import 'package:showcase/pages/components/examples/formatted_text_links.dart';
import 'package:showcase/pages/components/examples/formatted_text_mixed_tags.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class FormattedTextPage extends StatelessWidget {
  const FormattedTextPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.formattedText.name,
      child: ComponentExamples(
        title: 'ImmichFormattedText',
        subtitle: 'Render text with HTML formatting (bold, links).',
        examples: [
          ExampleCard(
            title: 'Bold Text',
            preview: const FormattedTextBoldText(),
            code: 'formatted_text_bold_text.dart',
          ),
          ExampleCard(
            title: 'Links',
            preview: const FormattedTextLinks(),
            code: 'formatted_text_links.dart',
          ),
          ExampleCard(
            title: 'Mixed Content',
            preview: const FormattedTextMixedContent(),
            code: 'formatted_text_mixed_tags.dart',
          ),
        ],
      ),
    );
  }
}
