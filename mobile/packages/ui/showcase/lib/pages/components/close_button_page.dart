import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class CloseButtonPage extends StatelessWidget {
  const CloseButtonPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.closeButton.name,
      child: ComponentExamples(
        title: 'ImmichCloseButton',
        subtitle: 'Pre-configured close button for dialogs and sheets.',
        examples: [
          ExampleCard(
            title: 'Default & Custom',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ImmichCloseButton(onPressed: () {}),
                ImmichCloseButton(
                  variant: ImmichVariant.filled,
                  onPressed: () {},
                ),
                ImmichCloseButton(
                  color: ImmichColor.secondary,
                  onPressed: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
