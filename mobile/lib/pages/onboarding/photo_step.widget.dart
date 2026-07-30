import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/onboarding/step_layout.widget.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:permission_handler/permission_handler.dart';

class OnboardingPhotoStep extends ConsumerWidget {
  final VoidCallback onNext;

  const OnboardingPhotoStep({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permission = ref.watch(galleryPermissionNotifier);

    return switch (permission) {
      .granted || .provisional => OnboardingStepLayout(
        icon: Icons.check_circle_outline,
        title: context.t.onboarding_permission_photos_granted,
        actions: [ImmichTextButton(labelText: context.t.continue$, onPressed: onNext)],
      ),
      .limited => OnboardingStepLayout(
        icon: Icons.warning_amber_rounded,
        title: context.t.onboarding_permission_photos_limited_title,
        description: context.t.onboarding_permission_photos_limited_description,
        actions: <ImmichTextButton>[
          .new(labelText: context.t.onboarding_go_to_settings, onPressed: openAppSettings),
          .new(labelText: context.t.continue$, onPressed: onNext, variant: .ghost),
        ],
      ),
      .denied || .restricted || .permanentlyDenied => OnboardingStepLayout(
        icon: Icons.block,
        title: context.t.onboarding_permission_photos_denied_title,
        description: context.t.onboarding_permission_photos_denied_description,
        actions: <ImmichTextButton>[
          .new(labelText: context.t.onboarding_go_to_settings, onPressed: openAppSettings),
          .new(labelText: context.t.onboarding_continue_anyway, onPressed: onNext, variant: .ghost),
        ],
      ),
    };
  }
}
