import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class ThumbnailWithInfoContainer extends StatelessWidget {
  const ThumbnailWithInfoContainer({
    super.key,
    this.onTap,
    this.borderRadius = 10,
    required this.label,
    required this.child,
  });

  final VoidCallback? onTap;
  final double borderRadius;
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        alignment: Alignment.bottomLeft,
        children: [
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              gradient: LinearGradient(
                colors: [
                  context.colorScheme.surfaceContainer,
                  context.colorScheme.surfaceContainer.darken(amount: .1),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            foregroundDecoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              color: Colors.white,
              gradient: LinearGradient(
                begin: FractionalOffset.topCenter,
                end: FractionalOffset.bottomCenter,
                colors: [
                  Colors.transparent,
                  label == ''
                      ? Colors.black.withValues(alpha: 0.1)
                      : Colors.black.withValues(alpha: 0.5),
                ],
                stops: const [0.0, 1.0],
              ),
            ),
            child: child,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8) +
                const EdgeInsets.only(bottom: 8),
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
              maxLines: 2,
              softWrap: false,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
