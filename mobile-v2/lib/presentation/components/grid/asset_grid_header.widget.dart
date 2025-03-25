part of 'asset_grid.widget.dart';

class _HeaderText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const _HeaderText({required this.text, this.style});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        left: 16.0,
        top: 32.0,
        right: 24.0,
        bottom: 16.0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(text, style: style),
          const Spacer(),
          Icon(
            Symbols.check_circle_rounded,
            color: context.colorScheme.onSurface
                .darken(amount: RatioConstants.oneThird),
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
        color: context.colorScheme.onSurface,
        fontSize: 24.0,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}

class _DayHeader extends StatelessWidget {
  final String text;

  const _DayHeader({required this.text});

  @override
  Widget build(BuildContext context) {
    return _HeaderText(
      text: text,
      style: context.textTheme.bodyMedium?.copyWith(
        color: context.colorScheme.onSurface,
        fontSize: 20.0,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
