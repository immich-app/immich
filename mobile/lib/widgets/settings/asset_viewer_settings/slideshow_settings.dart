import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class SlideshowSettings extends HookConsumerWidget {
  const SlideshowSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressBar = useAppSettingsState(AppSettingsEnum.slideshowProgressBar);
    final transition = useAppSettingsState(AppSettingsEnum.slideshowTransition);
    final repeat = useAppSettingsState(AppSettingsEnum.slideshowRepeat);
    final duration = useAppSettingsState(AppSettingsEnum.slideshowDuration);
    final look = useAppSettingsState(AppSettingsEnum.slideshowLook);
    final direction = useAppSettingsState(AppSettingsEnum.slideshowDirection);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: 'slideshow'.t(context: context),
          icon: Icons.slideshow_outlined,
        ),
        SettingsSwitchListTile(
          valueNotifier: progressBar,
          title: "show_progress_bar".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: transition,
          title: "show_slideshow_transition".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
          enabled: direction.value != SlideshowDirection.shuffle.index,
        ),
        SettingsSwitchListTile(
          valueNotifier: repeat,
          title: "slideshow_repeat".t(context: context),
          subtitle: "slideshow_repeat_description".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSliderListTile(
          valueNotifier: duration,
          text: "duration".t(context: context),
          minValue: 1,
          noDivisons: 6,
          maxValue: 30,
        ),
        SettingsSubTitle(title: 'look'.t(context: context)),
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
          groupBy: SlideshowLook.values[look.value],
          onRadioChanged: (value) async {
            if (value != null) {
              look.value = value.index;
              await ref.watch(appSettingsServiceProvider).setSetting(AppSettingsEnum.slideshowLook, value.index);
              ref.invalidate(appSettingsServiceProvider);
            }
          },
        ),
        SettingsSubTitle(title: 'direction'.t(context: context)),
        SettingsRadioListTile(
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
          groupBy: SlideshowDirection.values[direction.value],
          onRadioChanged: (value) async {
            if (value != null) {
              direction.value = value.index;
              await ref.watch(appSettingsServiceProvider).setSetting(AppSettingsEnum.slideshowDirection, value.index);
              ref.invalidate(appSettingsServiceProvider);
            }
          },
        ),
      ],
    );
  }
}
