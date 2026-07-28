import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/onboarding/step_layout.widget.dart';
import 'package:immich_ui/immich_ui.dart';

class OnboardingDoneStep extends StatelessWidget {
  final VoidCallback onFinish;

  const OnboardingDoneStep({super.key, required this.onFinish});

  @override
  Widget build(BuildContext context) {
    return OnboardingStepLayout(
      icon: Icons.celebration_outlined,
      title: context.t.onboarding_done_title,
      description: context.t.onboarding_done_description,
      actions: [ImmichTextButton(labelText: context.t.done, onPressed: onFinish)],
    );
  }
}
