import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class IndicatorSettings extends HookConsumerWidget {
  const IndicatorSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineConfig = ref.watch(appConfigProvider.select((s) => s.timeline));
    final storageIndicator = useValueNotifier(timelineConfig.storageIndicator);
    final videoIndicator = useValueNotifier(timelineConfig.videoIndicator);
    final livePhotoIndicator = useValueNotifier(timelineConfig.livePhotoIndicator);
    final animatedImageIndicator = useValueNotifier(timelineConfig.animatedImageIndicator);
    final rawIndicator = useValueNotifier(timelineConfig.rawIndicator);
    final stackIndicator = useValueNotifier(timelineConfig.stackIndicator);
    final favoriteIndicator = useValueNotifier(timelineConfig.favoriteIndicator);

    SettingsSwitchListTile indicatorSwitch(ValueNotifier<bool> notifier, SettingsKey<bool> key, String title) {
      return SettingsSwitchListTile(
        valueNotifier: notifier,
        title: title,
        onChanged: (value) {
          unawaited(ref.read(settingsProvider).write(key, value));
          ref.invalidate(appSettingsServiceProvider);
          ref.invalidate(settingsProvider);
        },
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(title: context.t.asset_list_indicators_sub_title, icon: Icons.label_outline),
        indicatorSwitch(
          storageIndicator,
          .timelineStorageIndicator,
          context.t.theme_setting_asset_list_storage_indicator_title,
        ),
        indicatorSwitch(
          videoIndicator,
          .timelineVideoIndicator,
          context.t.theme_setting_asset_list_video_indicator_title,
        ),
        indicatorSwitch(
          livePhotoIndicator,
          .timelineLivePhotoIndicator,
          context.t.theme_setting_asset_list_live_photo_indicator_title,
        ),
        indicatorSwitch(
          animatedImageIndicator,
          .timelineAnimatedImageIndicator,
          context.t.theme_setting_asset_list_animated_image_indicator_title,
        ),
        indicatorSwitch(rawIndicator, .timelineRawIndicator, context.t.theme_setting_asset_list_raw_indicator_title),
        indicatorSwitch(
          stackIndicator,
          .timelineStackIndicator,
          context.t.theme_setting_asset_list_stack_indicator_title,
        ),
        indicatorSwitch(
          favoriteIndicator,
          .timelineFavoriteIndicator,
          context.t.theme_setting_asset_list_favorite_indicator_title,
        ),
      ],
    );
  }
}
