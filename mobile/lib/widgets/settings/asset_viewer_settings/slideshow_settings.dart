import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class SlideshowSettings extends HookConsumerWidget {
  const SlideshowSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slideshow = ref.watch(appConfigProvider).slideshow;
    final useRepeat = useState(slideshow.repeat);
    final useDuration = useState(slideshow.duration);
    final useLook = useState(slideshow.look);
    final useDirection = useState(slideshow.direction);

    useValueChanged<bool, void>(useRepeat.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.slideshowRepeat, useRepeat.value));
    });
    useValueChanged<int, void>(useDuration.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.slideshowDuration, useDuration.value));
    });
    useValueChanged<SlideshowLook, void>(useLook.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.slideshowLook, useLook.value));
    });
    useValueChanged<SlideshowDirection, void>(useDirection.value, (_, _) {
      unawaited(ref.read(settingsProvider).write(.slideshowDirection, useDirection.value));
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(title: context.t.slideshow, icon: Icons.slideshow_outlined),
        SettingsSwitchListTile(
          valueNotifier: useRepeat,
          title: context.t.slideshow_repeat,
          subtitle: context.t.slideshow_repeat_description,
        ),
        SettingsSliderListTile(
          valueNotifier: useDuration,
          text: context.t.duration,
          minValue: 5,
          noDivisons: 5,
          maxValue: 30,
        ),
        Padding(
          padding: const EdgeInsets.only(top: 20),
          child: SettingsSubTitle(title: context.t.look),
        ),
        SettingsRadioListTile(
          groups: [
            SettingsRadioGroup(title: context.t.contain, value: SlideshowLook.contain),
            SettingsRadioGroup(title: context.t.cover, value: SlideshowLook.cover),
            SettingsRadioGroup(title: context.t.blurred_background, value: SlideshowLook.blurredBackground),
          ],
          groupBy: useLook.value,
          onRadioChanged: (value) {
            if (value != null) {
              useLook.value = value;
            }
          },
        ),
        Padding(
          padding: const EdgeInsets.only(top: 20),
          child: SettingsSubTitle(title: context.t.direction),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: SettingsRadioListTile(
            groups: [
              SettingsRadioGroup(title: context.t.forward, value: SlideshowDirection.forward),
              SettingsRadioGroup(title: context.t.backward, value: SlideshowDirection.backward),
              SettingsRadioGroup(title: context.t.shuffle, value: SlideshowDirection.shuffle),
            ],
            groupBy: useDirection.value,
            onRadioChanged: (value) {
              if (value != null) {
                useDirection.value = value;
              }
            },
          ),
        ),
      ],
    );
  }
}
