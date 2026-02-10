import 'dart:math';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_quality_override.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/formatted_duration.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

class VideoPosition extends HookConsumerWidget {
  const VideoPosition({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCasting = ref.watch(castProvider).isCasting;

    final (position, duration) = isCasting
        ? ref.watch(castProvider.select((c) => (c.currentTime, c.duration)))
        : ref.watch(videoPlaybackValueProvider.select((v) => (v.position, v.duration)));

    final wasPlaying = useRef<bool>(true);
    return duration == Duration.zero
        ? const _VideoPositionPlaceholder()
        : Column(
            children: [
              Padding(
                // align with slider's inherent padding
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    FormattedDuration(position),
                    Row(
                      children: [FormattedDuration(duration), const SizedBox(width: 8), const _QualitySettingsButton()],
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: Slider(
                      value: min(position.inMicroseconds / duration.inMicroseconds * 100, 100),
                      min: 0,
                      max: 100,
                      thumbColor: Colors.white,
                      activeColor: Colors.white,
                      inactiveColor: whiteOpacity75,
                      onChangeStart: (value) {
                        final state = ref.read(videoPlaybackValueProvider).state;
                        wasPlaying.value = state != VideoPlaybackState.paused;
                        ref.read(videoPlayerControlsProvider.notifier).pause();
                      },
                      onChangeEnd: (value) {
                        if (wasPlaying.value) {
                          ref.read(videoPlayerControlsProvider.notifier).play();
                        }
                      },
                      onChanged: (value) {
                        final seekToDuration = (duration * (value / 100.0));

                        if (isCasting) {
                          ref.read(castProvider.notifier).seekTo(seekToDuration);
                          return;
                        }

                        ref.read(videoPlayerControlsProvider.notifier).position = seekToDuration;

                        // This immediately updates the slider position without waiting for the video to update
                        ref.read(videoPlaybackValueProvider.notifier).position = seekToDuration;
                      },
                    ),
                  ),
                ],
              ),
            ],
          );
  }
}

class _VideoPositionPlaceholder extends StatelessWidget {
  const _VideoPositionPlaceholder();

  static void _onChangedDummy(_) {}

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [FormattedDuration(Duration.zero), FormattedDuration(Duration.zero)],
          ),
        ),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: 0.0,
                min: 0,
                max: 100,
                thumbColor: Colors.white,
                activeColor: Colors.white,
                inactiveColor: whiteOpacity75,
                onChanged: _onChangedDummy,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QualitySettingsButton extends HookConsumerWidget {
  const _QualitySettingsButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final override = ref.watch(videoQualityOverrideProvider);
    final globalSetting = ref.watch(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.loadOriginalVideo);

    // Determine effective quality:
    // If override is null, use global setting.
    // Otherwise use override.
    final isOriginal = override ?? globalSetting;

    return IconButton(
      icon: Icon(Icons.settings_outlined, color: isOriginal ? Colors.white : Colors.amber, size: 20),
      tooltip: 'video_quality_settings_title'.tr(),
      onPressed: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: const Color(0xFF202124),
          useSafeArea: true,
          builder: (context) => Padding(
            padding: EdgeInsets.only(top: 20, bottom: MediaQuery.paddingOf(context).bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 15),
                  child: Text(
                    "video_quality_settings_title".tr(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.hd_outlined, color: Colors.white),
                  title: Text("video_quality_original".tr(), style: const TextStyle(color: Colors.white)),
                  subtitle: Text(
                    "video_quality_original_subtitle".tr(),
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  trailing: isOriginal ? const Icon(Icons.check, color: Colors.blue) : null,
                  onTap: () {
                    ref.read(videoQualityOverrideProvider.notifier).state = true;
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.sd_storage_outlined, color: Colors.white),
                  title: Text("video_quality_data_saver".tr(), style: const TextStyle(color: Colors.white)),
                  subtitle: Text(
                    "video_quality_data_saver_subtitle".tr(),
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  trailing: !isOriginal ? const Icon(Icons.check, color: Colors.blue) : null,
                  onTap: () {
                    ref.read(videoQualityOverrideProvider.notifier).state = false;
                    Navigator.pop(context);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
