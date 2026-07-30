import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/onboarding/step_layout.widget.dart';
import 'package:immich_mobile/providers/permission.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:permission_handler/permission_handler.dart';

class OnboardingNotificationStep extends ConsumerWidget {
  final VoidCallback onNext;

  const OnboardingNotificationStep({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(notificationPermissionProvider);

    Future<void> request() async {
      await ref.read(notificationPermissionProvider.notifier).requestNotificationPermission();
      if (context.mounted) {
        onNext();
      }
    }

    return switch (status) {
      .granted || .provisional => OnboardingStepLayout(
        icon: Icons.notifications_active_outlined,
        title: context.t.notification_enabled_list_tile_title,
        description: context.t.onboarding_permission_notifications_description,
        actions: [ImmichTextButton(labelText: context.t.continue$, onPressed: onNext)],
      ),
      .denied || .limited => OnboardingStepLayout(
        icon: Icons.notifications_outlined,
        title: context.t.onboarding_permission_notifications_title,
        description: context.t.onboarding_permission_notifications_description,
        actions: <ImmichTextButton>[
          .new(labelText: context.t.grant_permission, onPressed: request),
          .new(labelText: context.t.skip, onPressed: onNext, variant: .ghost),
        ],
      ),
      .restricted || .permanentlyDenied => OnboardingStepLayout(
        icon: Icons.notifications_off_outlined,
        title: context.t.onboarding_permission_notifications_title,
        description: context.t.notification_backup_reliability,
        actions: <ImmichTextButton>[
          .new(labelText: context.t.onboarding_go_to_settings, onPressed: openAppSettings),
          .new(labelText: context.t.skip, onPressed: onNext, variant: .ghost),
        ],
      ),
    };
  }
}
