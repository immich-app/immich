import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_ui/immich_ui.dart';

class OnboardingStepLayout extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? description;
  final Widget? body;
  final List<Widget> actions;

  const OnboardingStepLayout({
    super.key,
    required this.icon,
    required this.title,
    required this.actions,
    this.description,
    this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        constraints: const .new(maxWidth: 380),
        padding: const .fromLTRB(ImmichSpacing.xl, 0, ImmichSpacing.xl, ImmichSpacing.xl),
        child: Column(
          crossAxisAlignment: .stretch,
          spacing: ImmichSpacing.xl,
          children: [
            const Spacer(flex: 2),
            Icon(icon, size: ImmichIconSize.xxl, color: context.primaryColor),
            Column(
              crossAxisAlignment: .stretch,
              spacing: ImmichSpacing.md,
              children: [
                Text(title, textAlign: .center, style: context.textTheme.headlineSmall),
                if (description != null)
                  Text(
                    description!,
                    textAlign: .center,
                    style: context.textTheme.bodyLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
                  ),
              ],
            ),
            if (body != null) body!,
            const Spacer(flex: 3),
            Column(crossAxisAlignment: .stretch, spacing: ImmichSpacing.sm, children: actions),
          ],
        ),
      ),
    );
  }
}
