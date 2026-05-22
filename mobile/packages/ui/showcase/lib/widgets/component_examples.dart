import 'package:flutter/material.dart';

class ComponentExamples extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget> examples;
  final bool expand;

  const ComponentExamples({
    super.key,
    required this.title,
    this.subtitle,
    required this.examples,
    this.expand = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 24, 24, 24),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _PageHeader(title: title, subtitle: subtitle),
          ),
          const SliverPadding(padding: EdgeInsets.only(top: 24)),
          if (expand)
            SliverList.builder(
              itemCount: examples.length,
              itemBuilder: (context, index) => examples[index],
            )
          else
            SliverLayoutBuilder(
              builder: (context, constraints) {
                return SliverList.builder(
                  itemCount: examples.length,
                  itemBuilder: (context, index) => Align(
                    alignment: Alignment.centerLeft,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minWidth: constraints.crossAxisExtent * 0.6,
                        maxWidth: constraints.crossAxisExtent,
                      ),
                      child: IntrinsicWidth(child: examples[index]),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _PageHeader extends StatelessWidget {
  final String title;
  final String? subtitle;

  const _PageHeader({required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 8),
          Text(
            subtitle!,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }
}
