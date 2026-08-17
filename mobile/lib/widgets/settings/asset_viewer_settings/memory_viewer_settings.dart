import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

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
        SettingGroupTitle(title: context.t.memories, icon: Icons.restore),
        SettingsSwitchListTile(
          valueNotifier: autoplayMemories,
          title: context.t.setting_memories_autoplay_title,
          subtitle: context.t.setting_memories_autoplay_subtitle,
        ),
      ],
    );
  }
}
