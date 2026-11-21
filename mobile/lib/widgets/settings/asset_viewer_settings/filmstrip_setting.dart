import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class FilmstripSetting extends HookConsumerWidget {
  const FilmstripSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewerConfig = ref.watch(appConfigProvider.select((c) => c.viewer));
    final filmstripEnabled = useState(viewerConfig.filmstripEnabled);
    useValueChanged<bool, void>(filmstripEnabled.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.viewerFilmstripEnabled, filmstripEnabled.value));
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: context.t.setting_filmstrip_title),
        SettingsSwitchListTile(
          valueNotifier: filmstripEnabled,
          title: context.t.setting_filmstrip_enable_title,
          subtitle: context.t.setting_filmstrip_enable_subtitle,
        ),
      ],
    );
  }
}
