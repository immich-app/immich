import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class CastSettings extends HookConsumerWidget {
  const CastSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final isCasting = ref.watch(castProvider.select((s) => s.isCasting));

    return SettingsSubPageScaffold(
      settings: [
        SwitchListTile(
          title: Text(context.t.cast_enabled_on_device),
          value: config.castEnabled,
          onChanged: (enabled) async {
            if (!enabled && isCasting) {
              await ref.read(castProvider.notifier).disconnect();
            }
            await ref.read(settingsProvider).write(.castEnabled, enabled);
          },
        ),
      ],
    );
  }
}
