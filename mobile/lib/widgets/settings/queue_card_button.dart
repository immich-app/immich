import 'package:flutter/material.dart';

enum QueueCardButtonColor { primary, secondary, outlined }

class QueueCardButton extends StatelessWidget {
  const QueueCardButton({
    super.key,
    required this.icon,
    required this.label,
    this.color = QueueCardButtonColor.outlined,
    this.disabled = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final QueueCardButtonColor color;
  final bool disabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: disabled ? null : onTap,
      borderRadius: const BorderRadius.all(Radius.circular(12)),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        decoration: _getDecoration(context),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 24, color: _getContentColor(context)),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(fontSize: 12, color: _getContentColor(context), fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Color _getContentColor(BuildContext context) {
    if (disabled) {
      return Colors.grey.shade500;
    }

    return switch (color) {
      QueueCardButtonColor.primary => Theme.of(context).colorScheme.onPrimary,
      QueueCardButtonColor.secondary => Theme.of(context).colorScheme.onSecondary,
      QueueCardButtonColor.outlined => Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8),
    };
  }

  BoxDecoration _getDecoration(BuildContext context) {
    if (disabled) {
      return BoxDecoration(color: Colors.grey.shade300, borderRadius: const BorderRadius.all(Radius.circular(12)));
    }

    return switch (color) {
      QueueCardButtonColor.primary => BoxDecoration(
        color: Theme.of(context).colorScheme.primary,
        borderRadius: const BorderRadius.all(Radius.circular(12)),
      ),
      QueueCardButtonColor.secondary => BoxDecoration(
        color: Theme.of(context).colorScheme.secondary,
        borderRadius: const BorderRadius.all(Radius.circular(12)),
      ),
      QueueCardButtonColor.outlined => BoxDecoration(
        color: Colors.transparent,
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5), width: 1.5),
      ),
    };
  }
}

class StatisticBox extends StatelessWidget {
  const StatisticBox({
    super.key,
    required this.label,
    required this.value,
    this.colorScheme = StatisticBoxColorScheme.primary,
  });

  final String label;
  final int value;
  final StatisticBoxColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final isPrimary = colorScheme == StatisticBoxColorScheme.primary;
    final isTertiary = colorScheme == StatisticBoxColorScheme.tertiary;

    Color bgColor;
    Color fgColor;

    if (isPrimary) {
      bgColor = Theme.of(context).colorScheme.primary;
      fgColor = Theme.of(context).colorScheme.onPrimary;
    } else if (isTertiary) {
      bgColor = Theme.of(context).colorScheme.tertiary;
      fgColor = Theme.of(context).colorScheme.onTertiary;
    } else {
      bgColor = Theme.of(context).colorScheme.secondary;
      fgColor = Theme.of(context).colorScheme.onSecondary;
    }

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.only(
            topLeft: isPrimary ? const Radius.circular(12) : Radius.zero,
            bottomLeft: isPrimary ? const Radius.circular(12) : Radius.zero,
            topRight: (isTertiary || !isPrimary) ? const Radius.circular(12) : Radius.zero,
            bottomRight: (isTertiary || !isPrimary) ? const Radius.circular(12) : Radius.zero,
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fgColor.withValues(alpha: 0.7)),
              ),
              const SizedBox(height: 2),
              Text(
                value > 99999 ? _formatNumber(value) : value.toString(),
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: fgColor),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
}

enum StatisticBoxColorScheme { primary, tertiary }
