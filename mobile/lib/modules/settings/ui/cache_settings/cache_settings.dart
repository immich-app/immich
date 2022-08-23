import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/cache_settings/cache_settings_slider_pref.dart';
import 'package:immich_mobile/shared/services/cache.service.dart';

class CacheSettings extends HookConsumerWidget {

  const CacheSettings({
    Key? key,
  }) : super(key: key);


  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final CacheService cacheService = ref.watch(cacheServiceProvider);

    void clearCache() {
      cacheService.emptyAllCaches();
    }

    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'cache_settings_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'cache_settings_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        const CacheSettingsSliderPref(
          setting: AppSettingsEnum.albumThumbnailCacheSize,
          translationKey: "cache_settings_thumbnail_size",
          min: 5000,
          max: 80000,
          divisions: 15,
        ),
        const CacheSettingsSliderPref(
          setting: AppSettingsEnum.imageCacheSize,
          translationKey: "cache_settings_image_cache_size",
          min: 0,
          max: 8000,
          divisions: 16,
        ),
        const CacheSettingsSliderPref(
          setting: AppSettingsEnum.albumThumbnailCacheSize,
          translationKey: "cache_settings_album_thumbnails",
          min: 50,
          max: 800,
          divisions: 15,
        ),
        ListTile(
          title: const Text(
            "cache_settings_clear_cache_button_title",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: clearCache,
          child: Text(
            "cache_settings_clear_cache_button",
            style: TextStyle(
              color: Theme.of(context).primaryColor,
            ),
          ).tr(),
        ),
      ],
    );
  }
}
