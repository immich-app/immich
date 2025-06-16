import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/backup/exp_backup.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/backup/backup_info_card.dart';
import 'package:immich_mobile/widgets/backup/exp_upload_option_toggle.dart';

@RoutePage()
class ExpBackupPage extends HookConsumerWidget {
  const ExpBackupPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useEffect(
      () {
        ref.read(expBackupProvider.notifier).getBackupStatus();
        return null;
      },
      [],
    );

    Widget buildControlButtons() {
      return Padding(
        padding: const EdgeInsets.only(
          top: 24,
        ),
        child: Column(
          children: [
            ElevatedButton(
              onPressed: () => ref.read(expBackupProvider.notifier).backup(),
              child: const Text(
                "backup_controller_page_start_backup",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
            ),
            OutlinedButton(
              onPressed: () => ref.read(expBackupProvider.notifier).cancel(),
              child: const Text(
                "cancel",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          "Backup (Experimental)",
        ),
        leading: IconButton(
          onPressed: () {
            ref.watch(websocketProvider.notifier).listenUploadEvent();
            context.maybePop(true);
          },
          splashRadius: 24,
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: IconButton(
              onPressed: () => context.pushRoute(const BackupOptionsRoute()),
              splashRadius: 24,
              icon: const Icon(
                Icons.settings_outlined,
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(
              left: 16.0,
              right: 16,
              bottom: 32,
            ),
            child: ListView(
              children: [
                const SizedBox(height: 8),
                ExpUploadOptionToggle(
                  onToggle: () =>
                      context.replaceRoute(const BackupControllerRoute()),
                ),
                const SizedBox(height: 8),
                const BackupAlbumSelectionCard(),
                const TotalCard(),
                const BackupCard(),
                const RemainderCard(),
                const Divider(),
                buildControlButtons(),
                // const CurrentUploadingAssetInfoBox(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class BackupAlbumSelectionCard extends ConsumerWidget {
  const BackupAlbumSelectionCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget buildSelectedAlbumName() {
      String text = "backup_controller_page_backup_selected".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where(
            (album) => album.backupSelection == BackupSelection.selected,
          )
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          if (album.name == "Recent" || album.name == "Recents") {
            text += "${album.name} (${'all'.tr()}), ";
          } else {
            text += "${album.name}, ";
          }
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(
              color: context.primaryColor,
            ),
          ),
        );
      } else {
        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            "backup_controller_page_none_selected".tr(),
            style: context.textTheme.labelLarge?.copyWith(
              color: context.primaryColor,
            ),
          ),
        );
      }
    }

    Widget buildExcludedAlbumName() {
      String text = "backup_controller_page_excluded".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where(
            (album) => album.backupSelection == BackupSelection.excluded,
          )
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          text += "${album.name}, ";
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(
              color: Colors.red[300],
            ),
          ),
        );
      } else {
        return const SizedBox();
      }
    }

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: context.colorScheme.outlineVariant,
          width: 1,
        ),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: ListTile(
        minVerticalPadding: 18,
        title: Text(
          "backup_controller_page_albums",
          style: context.textTheme.titleMedium,
        ).tr(),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "backup_controller_page_to_backup",
                style: context.textTheme.bodyMedium?.copyWith(
                  color: context.colorScheme.onSurfaceSecondary,
                ),
              ).tr(),
              buildSelectedAlbumName(),
              buildExcludedAlbumName(),
            ],
          ),
        ),
        trailing: ElevatedButton(
          onPressed: () async {
            await context.pushRoute(const ExpBackupAlbumSelectionRoute());
            ref
                .read(backgroundSyncProvider)
                .syncRemote(); // TODO: remove after websocket is implemented

            ref.read(expBackupProvider.notifier).getBackupStatus();
          },
          child: const Text(
            "select",
            style: TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
      ),
    );
  }
}

class TotalCard extends ConsumerWidget {
  const TotalCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalCount = ref.watch(expBackupProvider.select((p) => p.totalCount));

    return BackupInfoCard(
      title: "total".tr(),
      subtitle: "backup_controller_page_total_sub".tr(),
      info: totalCount.toString(),
    );
  }
}

class BackupCard extends ConsumerWidget {
  const BackupCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupCount =
        ref.watch(expBackupProvider.select((p) => p.backupCount));

    return BackupInfoCard(
      title: "backup_controller_page_backup".tr(),
      subtitle: "backup_controller_page_backup_sub".tr(),
      info: backupCount.toString(),
    );
  }
}

class RemainderCard extends ConsumerWidget {
  const RemainderCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remainderCount =
        ref.watch(expBackupProvider.select((p) => p.remainderCount));
    return BackupInfoCard(
      title: "backup_controller_page_remainder".tr(),
      subtitle: "backup_controller_page_remainder_sub".tr(),
      info: remainderCount.toString(),
    );
  }
}
