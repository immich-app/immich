import 'package:flutter/material.dart';
import 'package:showcase/constants.dart';
import 'package:syntax_highlight/syntax_highlight.dart';

late final Highlighter _codeHighlighter;

Future<void> initializeCodeHighlighter() async {
  await Highlighter.initialize(['dart']);
  final darkTheme = await HighlighterTheme.loadFromAssets([
    'assets/themes/github_dark.json',
  ], const TextStyle(color: Color(0xFFe1e4e8)));

  _codeHighlighter = Highlighter(language: 'dart', theme: darkTheme);
}

class ExampleCard extends StatefulWidget {
  final String title;
  final String? description;
  final Widget preview;
  final String? code;

  const ExampleCard({
    super.key,
    required this.title,
    this.description,
    required this.preview,
    this.code,
  });

  @override
  State<ExampleCard> createState() => _ExampleCardState();
}

class _ExampleCardState extends State<ExampleCard> {
  bool _showPreview = true;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      if (widget.description != null)
                        Text(
                          widget.description!,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                        ),
                    ],
                  ),
                ),
                if (widget.code != null) ...[
                  const SizedBox(width: 16),
                  Row(
                    children: [
                      _ToggleButton(
                        icon: Icons.visibility_rounded,
                        label: 'Preview',
                        isSelected: _showPreview,
                        onTap: () => setState(() => _showPreview = true),
                      ),
                      const SizedBox(width: 8),
                      _ToggleButton(
                        icon: Icons.code_rounded,
                        label: 'Code',
                        isSelected: !_showPreview,
                        onTap: () => setState(() => _showPreview = false),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          if (_showPreview)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(width: double.infinity, child: widget.preview),
            )
          else
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFF24292e),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(
                    LayoutConstants.borderRadiusMedium,
                  ),
                  bottomRight: Radius.circular(
                    LayoutConstants.borderRadiusMedium,
                  ),
                ),
              ),
              child: _CodeCard(code: widget.code!),
            ),
        ],
      ),
    );
  }
}

class _ToggleButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToggleButton({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.7)
              : Theme.of(context).colorScheme.primary,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: Theme.of(context).colorScheme.onPrimary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onPrimary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CodeCard extends StatelessWidget {
  final String code;

  const _CodeCard({required this.code});

  @override
  Widget build(BuildContext context) {
    final lines = code.split('\n');
    final lineNumberColor = Colors.white.withValues(alpha: 0.4);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Padding(
        padding: const EdgeInsets.only(left: 12, top: 8, bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(
                lines.length,
                (index) => SizedBox(
                  height: 20,
                  child: Text(
                    '${index + 1}',
                    style: TextStyle(
                      fontFamily: 'GoogleSansCode',
                      fontSize: 13,
                      color: lineNumberColor,
                      height: 1.5,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            SelectableText.rich(
              _codeHighlighter.highlight(code),
              style: const TextStyle(
                fontFamily: 'GoogleSansCode',
                fontSize: 13,
                height: 1.54,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
