import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/live_wallpaper_platform.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';

class LiveWallpaperSetting extends HookConsumerWidget {
  const LiveWallpaperSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only show live wallpaper settings on Android
    if (!Platform.isAndroid) {
      return const SizedBox.shrink();
    }

    final statusAsync = ref.watch(liveWallpaperStatusProvider);

    final statusText = statusAsync.when<String?>(
      data: (status) {
        if (!status.isSupported) {
          return 'live_wallpaper_status_not_supported'.tr();
        }
        if (status.lastError != null && status.lastError!.isNotEmpty) {
          return 'live_wallpaper_status_error'.tr(namedArgs: {'error': status.lastError!});
        }
        return null;
      },
      loading: () => 'live_wallpaper_status_syncing'.tr(),
      error: (error, _) => 'live_wallpaper_status_error'.tr(namedArgs: {'error': error.toString()}),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: 'live_wallpaper_setting_title'.tr()),
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: ListTile(
            title: Text('live_wallpaper_setting_manage'.tr()),
            subtitle: statusText == null
              ? null
              : Text(statusText, style: Theme.of(context).textTheme.bodySmall),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.pushRoute(const LiveWallpaperSetupRoute()),
          ),
        ),
      ],
    );
  }
}
