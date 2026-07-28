import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/onboarding/step_layout.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_ui/immich_ui.dart';

class OnboardingBackupStep extends ConsumerWidget {
  final VoidCallback onNext;

  const OnboardingBackupStep({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = ref.watch(appConfigProvider.select((config) => config.backup.enabled));
    final preparing = ref.watch(syncStatusProvider.select((status) => status.isLocalSyncing));

    return OnboardingStepLayout(
      icon: Icons.backup_outlined,
      title: context.t.onboarding_backup_title,
      description: context.t.onboarding_backup_description,
      body: preparing
          ? const Padding(
              padding: .symmetric(vertical: ImmichSpacing.xl),
              child: Center(
                child: SizedBox.square(dimension: ImmichIconSize.lg, child: CircularProgressIndicator()),
              ),
            )
          : Column(
              crossAxisAlignment: .stretch,
              spacing: ImmichSpacing.sm,
              children: [
                SwitchListTile(
                  contentPadding: .zero,
                  title: Text(context.t.enable_backup),
                  value: enabled,
                  onChanged: (value) => ref.read(settingsProvider).write(.backupEnabled, value),
                ),
                if (enabled) ...<ImmichTextButton>[
                  .new(
                    labelText: context.t.select_albums,
                    icon: Icons.photo_album_outlined,
                    variant: .ghost,
                    onPressed: () => context.pushRoute(const DriftBackupAlbumSelectionRoute()),
                  ),
                  .new(
                    labelText: context.t.backup_options,
                    icon: Icons.settings_outlined,
                    variant: .ghost,
                    onPressed: () => context.pushRoute(const DriftBackupOptionsRoute()),
                  ),
                ],
                Text(
                  context.t.onboarding_backup_manual_hint,
                  textAlign: .center,
                  style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceSecondary),
                ),
              ],
            ),
      actions: [ImmichTextButton(labelText: context.t.continue$, onPressed: onNext)],
    );
  }
}
