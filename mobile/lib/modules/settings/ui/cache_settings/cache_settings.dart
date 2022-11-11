import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/cache_settings/cache_settings_slider_pref.dart';
import 'package:immich_mobile/shared/services/cache.service.dart';
import 'package:immich_mobile/utils/bytes_units.dart';

class CacheSettings extends HookConsumerWidget {
  const CacheSettings({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final CacheService cacheService = ref.watch(cacheServiceProvider);
    final clearCacheState = useState(false);

    Future<void> clearCache() async {
      await cacheService.emptyAllCaches();
      clearCacheState.value = true;
    }

    Widget cacheStatisticsRow(String name, CacheType type) {
      final cacheSize = useState(0);
      final cacheAssets = useState(0);

      if (!clearCacheState.value) {
        final repo = cacheService.getCacheRepo(type);

        repo.open().then((_) {
          cacheSize.value = repo.getCacheSize();
          cacheAssets.value = repo.getNumberOfCachedObjects();
        });
      } else {
        cacheSize.value = 0;
        cacheAssets.value = 0;
      }

      return Container(
        margin: const EdgeInsets.only(left: 20, bottom: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              name,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text(
              "cache_settings_statistics_assets",
              style: TextStyle(color: Colors.grey),
            ).tr(
              args: ["${cacheAssets.value}", formatBytes(cacheSize.value)],
            ),
          ],
        ),
      );
    }

    return ExpansionTile(
      expandedCrossAxisAlignment: CrossAxisAlignment.start,
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
          setting: AppSettingsEnum.thumbnailCacheSize,
          translationKey: "cache_settings_thumbnail_size",
          min: 1000,
          max: 20000,
          divisions: 19,
        ),
        const CacheSettingsSliderPref(
          setting: AppSettingsEnum.imageCacheSize,
          translationKey: "cache_settings_image_cache_size",
          min: 0,
          max: 1000,
          divisions: 20,
        ),
        const CacheSettingsSliderPref(
          setting: AppSettingsEnum.albumThumbnailCacheSize,
          translationKey: "cache_settings_album_thumbnails",
          min: 0,
          max: 1000,
          divisions: 20,
        ),
        ListTile(
          title: const Text(
            "cache_settings_statistics_title",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        cacheStatisticsRow(
          "cache_settings_statistics_thumbnail".tr(),
          CacheType.thumbnail,
        ),
        cacheStatisticsRow(
          "cache_settings_statistics_album".tr(),
          CacheType.albumThumbnail,
        ),
        cacheStatisticsRow(
          "cache_settings_statistics_shared".tr(),
          CacheType.sharedAlbumThumbnail,
        ),
        cacheStatisticsRow(
          "cache_settings_statistics_full".tr(),
          CacheType.imageViewerFull,
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
        Container(
          alignment: Alignment.center,
          child: ElevatedButton(
            onPressed: clearCache,
            child: const Text(
              "cache_settings_clear_cache_button",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ).tr(),
          ),
        )
      ],
    );
  }
}
