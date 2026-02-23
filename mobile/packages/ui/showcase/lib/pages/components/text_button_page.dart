import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class TextButtonPage extends StatefulWidget {
  const TextButtonPage({super.key});

  @override
  State<TextButtonPage> createState() => _TextButtonPageState();
}

class _TextButtonPageState extends State<TextButtonPage> {
  bool _isLoading = false;
  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.textButton.name,
      child: ComponentExamples(
        title: 'ImmichTextButton',
        subtitle:
            'A versatile button component with multiple variants and color options.',
        examples: [
          ExampleCard(
            title: 'Variants',
            description:
                'Filled and ghost variants for different visual hierarchy',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'Filled',
                  variant: ImmichVariant.filled,
                  expanded: false,
                ),
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'Ghost',
                  variant: ImmichVariant.ghost,
                  expanded: false,
                ),
              ],
            ),
          ),
          ExampleCard(
            title: 'Colors',
            description: 'Primary and secondary color options',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'Primary',
                  color: ImmichColor.primary,
                  expanded: false,
                ),
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'Secondary',
                  color: ImmichColor.secondary,
                  expanded: false,
                ),
              ],
            ),
          ),
          ExampleCard(
            title: 'With Icons',
            description: 'Add leading icons',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'With Icon',
                  icon: Icons.add,
                  expanded: false,
                ),
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'Download',
                  icon: Icons.download,
                  variant: ImmichVariant.ghost,
                  expanded: false,
                ),
              ],
            ),
          ),
          ExampleCard(
            title: 'Loading State',
            description: 'Shows loading indicator during async operations',
            preview: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ImmichTextButton(
                  onPressed: () async {
                    setState(() => _isLoading = true);
                    await Future.delayed(const Duration(seconds: 2));
                    if (mounted) setState(() => _isLoading = false);
                  },
                  labelText: _isLoading ? 'Loading...' : 'Click Me',
                  loading: _isLoading,
                  expanded: false,
                ),
              ],
            ),
          ),
          ExampleCard(
            title: 'Disabled State',
            description: 'Buttons can be disabled',
            preview: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'Disabled',
                  disabled: true,
                  expanded: false,
                ),
                ImmichTextButton(
                  onPressed: () {},
                  labelText: 'Disabled Ghost',
                  variant: ImmichVariant.ghost,
                  disabled: true,
                  expanded: false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
