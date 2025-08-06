import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';

class DriftBackupSettings extends StatelessWidget {
  const DriftBackupSettings({super.key});

  @override
  Widget build(BuildContext context) {
    return const SettingsSubPageScaffold(settings: [_UseWifiForUploadVideosButton(), _UseWifiForUploadPhotosButton()]);
  }
}

class _UseWifiForUploadVideosButton extends ConsumerWidget {
  const _UseWifiForUploadVideosButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final valueStream = Store.watch(StoreKey.useWifiForUploadVideos);

    return ListTile(
      title: Text(
        "videos".t(context: context),
        style: context.textTheme.titleMedium?.copyWith(color: context.primaryColor),
      ),
      subtitle: Text("network_requirement_videos_upload".t(context: context), style: context.textTheme.labelLarge),
      trailing: StreamBuilder(
        stream: valueStream,
        initialData: Store.tryGet(StoreKey.useWifiForUploadVideos) ?? false,
        builder: (context, snapshot) {
          final value = snapshot.data ?? false;
          return Switch(
            value: value,
            onChanged: (bool newValue) async {
              await ref
                  .read(appSettingsServiceProvider)
                  .setSetting(AppSettingsEnum.useCellularForUploadVideos, newValue);
            },
          );
        },
      ),
    );
  }
}

class _UseWifiForUploadPhotosButton extends ConsumerWidget {
  const _UseWifiForUploadPhotosButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final valueStream = Store.watch(StoreKey.useWifiForUploadPhotos);

    return ListTile(
      title: Text(
        "photos".t(context: context),
        style: context.textTheme.titleMedium?.copyWith(color: context.primaryColor),
      ),
      subtitle: Text("network_requirement_photos_upload".t(context: context), style: context.textTheme.labelLarge),
      trailing: StreamBuilder(
        stream: valueStream,
        initialData: Store.tryGet(StoreKey.useWifiForUploadPhotos) ?? false,
        builder: (context, snapshot) {
          final value = snapshot.data ?? false;
          return Switch(
            value: value,
            onChanged: (bool newValue) async {
              await ref
                  .read(appSettingsServiceProvider)
                  .setSetting(AppSettingsEnum.useCellularForUploadPhotos, newValue);
            },
          );
        },
      ),
    );
  }
}
