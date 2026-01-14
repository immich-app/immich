import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_ui/immich_ui.dart';

List<Widget> _showcaseBuilder(Function(ImmichVariant variant, ImmichColor color) builder) {
  final children = <Widget>[];

  final items = [
    (variant: ImmichVariant.filled, title: "Filled Variant"),
    (variant: ImmichVariant.ghost, title: "Ghost Variant"),
  ];

  for (final (:variant, :title) in items) {
    children.add(Text(title));
    children.add(Row(spacing: 10, children: [for (var color in ImmichColor.values) builder(variant, color)]));
  }

  return children;
}

class _ComponentTitle extends StatelessWidget {
  final String title;

  const _ComponentTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(title, style: context.textTheme.titleLarge);
  }
}

@RoutePage()
class ImmichUIShowcasePage extends StatelessWidget {
  const ImmichUIShowcasePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Immich UI Showcase')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            spacing: 10,
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _ComponentTitle("IconButton"),
              ..._showcaseBuilder(
                (variant, color) =>
                    ImmichIconButton(icon: Icons.favorite, color: color, variant: variant, onPressed: () {}),
              ),
              const _ComponentTitle("CloseButton"),
              ..._showcaseBuilder(
                (variant, color) => ImmichCloseButton(color: color, variant: variant, onPressed: () {}),
              ),
              const _ComponentTitle("TextButton"),

              ImmichTextButton(
                labelText: "Text Button",
                onPressed: () {},
                variant: ImmichVariant.filled,
                color: ImmichColor.primary,
              ),
              ImmichTextButton(
                labelText: "Text Button",
                onPressed: () {},
                variant: ImmichVariant.filled,
                color: ImmichColor.primary,
                loading: true,
              ),
              ImmichTextButton(
                labelText: "Text Button",
                onPressed: () {},
                variant: ImmichVariant.ghost,
                color: ImmichColor.primary,
              ),
              ImmichTextButton(
                labelText: "Text Button",
                onPressed: () {},
                variant: ImmichVariant.ghost,
                color: ImmichColor.primary,
                loading: true,
              ),
              const _ComponentTitle("Form"),
              ImmichForm(
                onSubmit: () {},
                child: const Column(
                  spacing: 10,
                  children: [ImmichTextInput(label: "Title", hintText: "Enter a title")],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
