import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

@RoutePage()
class DriftBackupOptionsPage extends ConsumerWidget {
  const DriftBackupOptionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text("backup_options".t(context: context))),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [const _UseWifiForUploadVideosButton(), const _UseWifiForUploadPhotosButton()],
      ),
    );
  }
}

class _UseWifiForUploadVideosButton extends ConsumerWidget {
  const _UseWifiForUploadVideosButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final valueStream = Store.watch(StoreKey.useWifiForUploadVideos);

    return ListTile(
      title: Text("network_requirements".t(context: context), style: context.textTheme.titleMedium),
      subtitle: Text(
        "network_requirements_description".t(context: context),
        style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
      ),
      trailing: StreamBuilder(
        stream: valueStream,
        builder: (context, snapshot) {
          final value = snapshot.data ?? false;
          return Switch(
            value: value,
            onChanged: (bool newValue) async {
              await ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.useWifiForUploadVideos, newValue);
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
    final valueStream = Store.watch(StoreKey.useWifiForUploadVideos);

    return ListTile(
      title: Text("network_requirements".t(context: context), style: context.textTheme.titleMedium),
      subtitle: Text(
        "network_requirements_description".t(context: context),
        style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
      ),
      trailing: StreamBuilder(
        stream: valueStream,
        builder: (context, snapshot) {
          final value = snapshot.data ?? false;
          return Switch(
            value: value,
            onChanged: (bool newValue) async {
              await ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.useWifiForUploadVideos, newValue);
            },
          );
        },
      ),
    );
  }
}
