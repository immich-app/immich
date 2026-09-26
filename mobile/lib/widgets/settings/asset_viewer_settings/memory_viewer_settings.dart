import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class MemoryViewerSettings extends HookConsumerWidget {
  const MemoryViewerSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final autoplayMemories = useState(ref.watch(appConfigProvider).viewer.autoplayMemories);
    useValueChanged<bool, void>(autoplayMemories.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.autoplayMemories, autoplayMemories.value));
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: context.t.memories),
        SettingsSwitchListTile(
          valueNotifier: autoplayMemories,
          title: context.t.setting_memories_autoplay_title,
          subtitle: context.t.setting_memories_autoplay_subtitle,
        ),
      ],
    );
  }
}
