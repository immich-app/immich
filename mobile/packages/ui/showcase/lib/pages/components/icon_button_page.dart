import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class IconButtonPage extends StatelessWidget {
  const IconButtonPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.iconButton.name,
      child: ComponentExamples(
        title: 'ImmichIconButton',
        subtitle: 'Icon-only button with customizable styling.',
        examples: [
          ExampleCard(
            title: 'Variants & Colors',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ImmichIconButton(
                  icon: Icons.add,
                  onPressed: () {},
                  variant: ImmichVariant.filled,
                ),
                ImmichIconButton(
                  icon: Icons.edit,
                  onPressed: () {},
                  variant: ImmichVariant.ghost,
                ),
                ImmichIconButton(
                  icon: Icons.delete,
                  onPressed: () {},
                  color: ImmichColor.secondary,
                ),
                ImmichIconButton(
                  icon: Icons.settings,
                  onPressed: () {},
                  disabled: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
