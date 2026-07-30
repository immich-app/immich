import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_ui/immich_ui.dart';

class OnboardingStepIndicator extends StatelessWidget {
  final int step;
  final int stepCount;

  const OnboardingStepIndicator({super.key, required this.step, required this.stepCount});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: .min,
      spacing: ImmichSpacing.xs,
      children: List.generate(
        stepCount,
        (index) => AnimatedContainer(
          duration: ImmichDuration.normal,
          width: index == step ? ImmichSpacing.xl : ImmichSpacing.sm,
          height: ImmichSpacing.sm,
          decoration: BoxDecoration(
            color: index <= step ? context.primaryColor : context.colorScheme.surfaceContainerHighest,
            borderRadius: const .all(.circular(ImmichRadius.xs)),
          ),
        ),
      ),
    );
  }
}
