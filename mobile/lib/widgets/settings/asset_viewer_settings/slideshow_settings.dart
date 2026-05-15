import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class SlideshowSettings extends HookConsumerWidget {
  const SlideshowSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slideshow = ref.read(appConfigProvider).slideshow;
    final useTransition = useState(slideshow.transition);
    final useRepeat = useState(slideshow.repeat);
    final useDuration = useState(slideshow.duration);
    final useLook = useState(slideshow.look);
    final useDirection = useState(slideshow.direction);

    useValueChanged<bool, void>(useTransition.value, (_, __) {
      ref.read(metadataProvider).write(.slideshowTransition, useTransition.value);
    });
    useValueChanged<bool, void>(useRepeat.value, (_, __) {
      ref.read(metadataProvider).write(.slideshowRepeat, useRepeat.value);
    });
    useValueChanged<int, void>(useDuration.value, (_, __) {
      ref.read(metadataProvider).write(.slideshowDuration, useDuration.value);
    });
    useValueChanged<SlideshowLook, void>(useLook.value, (_, __) {
      ref.read(metadataProvider).write(.slideshowLook, useLook.value);
    });
    useValueChanged<SlideshowDirection, void>(useDirection.value, (_, __) {
      ref.read(metadataProvider).write(.slideshowDirection, useDirection.value);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: 'slideshow'.t(context: context),
          icon: Icons.slideshow_outlined,
        ),
        SettingsSwitchListTile(
          valueNotifier: useTransition,
          title: "show_slideshow_transition".t(context: context),
          enabled: useDirection.value != SlideshowDirection.shuffle,
        ),
        SettingsSwitchListTile(
          valueNotifier: useRepeat,
          title: "slideshow_repeat".t(context: context),
          subtitle: "slideshow_repeat_description".t(context: context),
        ),
        SettingsSliderListTile(
          valueNotifier: useDuration,
          text: "duration".t(context: context),
          minValue: 5,
          noDivisons: 5,
          maxValue: 30,
        ),
        Padding(
          padding: const EdgeInsets.only(top: 20),
          child: SettingsSubTitle(title: 'look'.t(context: context)),
        ),
        SettingsRadioListTile(
          groups: [
            SettingsRadioGroup(
              title: 'contain'.t(context: context),
              value: SlideshowLook.contain,
            ),
            SettingsRadioGroup(
              title: 'cover'.t(context: context),
              value: SlideshowLook.cover,
            ),
            SettingsRadioGroup(
              title: 'blurred_background'.t(context: context),
              value: SlideshowLook.blurredBackground,
            ),
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
          child: SettingsSubTitle(title: 'direction'.t(context: context)),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: SettingsRadioListTile(
            groups: [
              SettingsRadioGroup(
                title: 'forward'.t(context: context),
                value: SlideshowDirection.forward,
              ),
              SettingsRadioGroup(
                title: 'backward'.t(context: context),
                value: SlideshowDirection.backward,
              ),
              SettingsRadioGroup(
                title: 'shuffle'.t(context: context),
                value: SlideshowDirection.shuffle,
              ),
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
