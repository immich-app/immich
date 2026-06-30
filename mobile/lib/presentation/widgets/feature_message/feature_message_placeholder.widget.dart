import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

/// Immich "brand splat" palette — the five semantic colors.
class _SplatColors {
  static const primary = Color(0xFF4250AF);
  static const info = Color(0xFF3B82F6);
  static const success = Color(0xFF2FB457);
  static const warning = Color(0xFFF2A73B);
  static const danger = Color(0xFFE5484D);
}

/// A deliberate placeholder for a "What's new" slide that ships without a
/// screenshot. Pure shapes + one icon — zero image assets. Fills its parent.
class FeatureMessagePlaceholder extends StatelessWidget {
  const FeatureMessagePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;

    final cardColor = dark ? const Color(0xFF232228) : const Color(0xFFEEEDF4);
    final tileColor = dark ? const Color(0xFF2B2A32) : const Color(0xFFFBFAFE);
    final inkColor = dark ? const Color(0xFFE7E7EC) : const Color(0xFF1A1A1E);
    final accent = dark ? const Color(0xFF9AA6DA) : _SplatColors.primary;

    return Container(
      width: double.infinity,
      height: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.all(Radius.circular(24))),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // ---- confetti motif (168 × 120 region) ----
          SizedBox(
            width: 168,
            height: 120,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // scattered confetti
                Positioned(left: 6, top: 24, child: _dot(12, _SplatColors.primary)),
                Positioned(left: 80, top: -2, child: _dot(9, _SplatColors.danger)),
                Positioned(left: 148, top: 84, child: _dot(11, _SplatColors.success)),
                Positioned(left: 140, top: 14, child: _bar(22, 8, 0.49, _SplatColors.danger)), // ~28°
                Positioned(left: 2, top: 90, child: _bar(20, 8, -0.31, _SplatColors.info)), // ~-18°
                // tilted spark tile
                Positioned(
                  left: 46,
                  top: 18,
                  child: Transform.rotate(
                    angle: -0.105, // ~-6°
                    child: Container(
                      width: 84,
                      height: 84,
                      decoration: BoxDecoration(
                        color: tileColor,
                        borderRadius: const BorderRadius.all(Radius.circular(18)),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F122D).withValues(alpha: 0.22),
                            blurRadius: 22,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Positioned(left: 12, top: 12, child: _dot(12, _SplatColors.warning)),
                          Icon(Icons.auto_awesome, size: 34, color: accent),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'new_feature'.tr(),
            style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: inkColor),
          ),
        ],
      ),
    );
  }

  static Widget _dot(double d, Color c) =>
      Container(width: d, height: d, decoration: BoxDecoration(color: c, shape: BoxShape.circle));

  static Widget _bar(double w, double h, double angle, Color c) => Transform.rotate(
    angle: angle,
    child: Container(
      width: w,
      height: h,
      decoration: BoxDecoration(color: c, borderRadius: const BorderRadius.all(Radius.circular(99))),
    ),
  );
}
