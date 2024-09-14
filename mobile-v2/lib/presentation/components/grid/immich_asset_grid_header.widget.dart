part of 'immich_asset_grid.widget.dart';

class _HeaderText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const _HeaderText({required this.text, this.style});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 32.0, left: 16.0, right: 24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(text, style: style),
          const Spacer(),
          Icon(
            Symbols.check_circle_rounded,
            color: context.colorScheme.onSurface,
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
      style: context.textTheme.bodyLarge?.copyWith(
        fontSize: 24.0,
        fontWeight: FontWeight.w500,
        color: context.colorScheme.onSurface,
      ),
    );
  }
}
