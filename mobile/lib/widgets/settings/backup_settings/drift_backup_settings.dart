import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';

class DriftBackupSettings extends ConsumerWidget {
  const DriftBackupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const SettingsSubPageScaffold(
      settings: [
        _UseWifiForUploadVideosButton(),
        _UseWifiForUploadPhotosButton(),
        Divider(indent: 16, endIndent: 16),
        _AlbumSyncActionButton(),
      ],
    );
  }
}

class _AlbumSyncActionButton extends ConsumerStatefulWidget {
  const _AlbumSyncActionButton();

  @override
  ConsumerState<_AlbumSyncActionButton> createState() => _AlbumSyncActionButtonState();
}

class _AlbumSyncActionButtonState extends ConsumerState<_AlbumSyncActionButton> {
  bool isAlbumSyncInProgress = false;

  Future<void> _manualSyncAlbums() async {
    setState(() {
      isAlbumSyncInProgress = true;
    });

    try {
      await ref.read(backgroundSyncProvider).syncLinkedAlbum();
      await ref.read(backgroundSyncProvider).syncRemote();
    } catch (_) {
    } finally {
      Future.delayed(const Duration(seconds: 1), () {
        setState(() {
          isAlbumSyncInProgress = false;
        });
      });
    }
  }

  Future<void> _manageLinkedAlbums() async {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      return;
    }
    final localAlbums = ref.read(backupAlbumProvider);
    final selectedBackupAlbums = localAlbums
        .where((album) => album.backupSelection == BackupSelection.selected)
        .toList();

    await ref.read(syncLinkedAlbumServiceProvider).manageLinkedAlbums(selectedBackupAlbums, currentUser.id);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      shrinkWrap: true,
      children: [
        StreamBuilder(
          stream: Store.watch(StoreKey.syncAlbums),
          initialData: Store.tryGet(StoreKey.syncAlbums) ?? false,
          builder: (context, snapshot) {
            final albumSyncEnable = snapshot.data ?? false;
            return Column(
              children: [
                ListTile(
                  title: Text(
                    "sync_albums".t(context: context),
                    style: context.textTheme.titleMedium?.copyWith(color: context.primaryColor),
                  ),
                  subtitle: Text(
                    "sync_upload_album_setting_subtitle".t(context: context),
                    style: context.textTheme.labelLarge,
                  ),
                  trailing: Switch(
                    value: albumSyncEnable,
                    onChanged: (bool newValue) async {
                      await ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.syncAlbums, newValue);

                      if (newValue == true) {
                        await _manageLinkedAlbums();
                      }
                    },
                  ),
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: albumSyncEnable ? 1.0 : 0.0,
                    child: albumSyncEnable
                        ? ListTile(
                            onTap: _manualSyncAlbums,
                            contentPadding: const EdgeInsets.only(left: 32, right: 16),
                            title: Text(
                              "organize_into_albums".t(context: context),
                              style: context.textTheme.titleSmall?.copyWith(
                                color: context.colorScheme.onSurface,
                                fontWeight: FontWeight.normal,
                              ),
                            ),
                            subtitle: Text(
                              "organize_into_albums_description".t(context: context),
                              style: context.textTheme.bodyMedium?.copyWith(
                                color: context.colorScheme.onSurface.withValues(alpha: 0.7),
                              ),
                            ),
                            trailing: isAlbumSyncInProgress
                                ? const SizedBox(
                                    width: 32,
                                    height: 32,
                                    child: CircularProgressIndicator.adaptive(strokeWidth: 2),
                                  )
                                : IconButton(
                                    onPressed: _manualSyncAlbums,
                                    icon: const Icon(Icons.sync_rounded),
                                    color: context.colorScheme.onSurface.withValues(alpha: 0.7),
                                    iconSize: 20,
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                  ),
                          )
                        : const SizedBox.shrink(),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
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
