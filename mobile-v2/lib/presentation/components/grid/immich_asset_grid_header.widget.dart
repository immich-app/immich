part of 'immich_asset_grid.widget.dart';

class _HeaderText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const _HeaderText({required this.text, this.style});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 32.0, left: 16.0, right: 12.0),
      child: Row(
        children: [
          Text(text, style: style),
          const Spacer(),
          IconButton(
            // ignore: no-empty-block
            onPressed: () {},
            icon: Icon(
              Symbols.check_circle_rounded,
              color: context.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthHeader extends StatelessWidget {
  final String text;

  const _MonthHeader({required this.text});

  @override
  Widget build(BuildContext context) {
    return _HeaderText(
      text: text,
      style: context.textTheme.bodyLarge?.copyWith(fontSize: 24.0),
    );
  }
}
