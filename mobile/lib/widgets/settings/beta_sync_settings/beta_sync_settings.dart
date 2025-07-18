import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/widgets/settings/beta_sync_settings/entity_count_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';

class BetaSyncSettings extends HookConsumerWidget {
  const BetaSyncSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetService = ref.watch(assetServiceProvider);
    final localAlbumService = ref.watch(localAlbumServiceProvider);
    final remoteAlbumService = ref.watch(remoteAlbumServiceProvider);
    final memoryService = ref.watch(driftMemoryServiceProvider);

    Future<List<dynamic>> loadCounts() async {
      final assetCounts = assetService.getAssetCounts();
      final localAlbumCounts = localAlbumService.getCount();
      final remoteAlbumCounts = remoteAlbumService.getCount();
      final memoryCount = memoryService.getCount();
      final getLocalHashedCount = assetService.getLocalHashedCount();

      return await Future.wait([
        assetCounts,
        localAlbumCounts,
        remoteAlbumCounts,
        memoryCount,
        getLocalHashedCount,
      ]);
    }

    return FutureBuilder<List<dynamic>>(
      future: loadCounts(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const CircularProgressIndicator();
        }

        final assetCounts = snapshot.data![0]! as (int, int);
        final localAssetCount = assetCounts.$1;
        final remoteAssetCount = assetCounts.$2;

        final localAlbumCount = snapshot.data![1]! as int;
        final remoteAlbumCount = snapshot.data![2]! as int;
        final memoryCount = snapshot.data![3]! as int;
        final localHashedCount = snapshot.data![4]! as int;

        return Padding(
          padding: const EdgeInsets.only(top: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SettingsSubTitle(title: "assets".tr()),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Wrap(
                  spacing: 16.0,
                  runSpacing: 16.0,
                  children: [
                    EntitiyCountTile(
                      label: "local".tr(),
                      count: localAssetCount,
                      icon: Icons.smartphone,
                    ),
                    EntitiyCountTile(
                      label: "remote".tr(),
                      count: remoteAssetCount,
                      icon: Icons.cloud,
                    ),
                  ],
                ),
              ),
              SettingsSubTitle(title: "albums".tr()),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Wrap(
                  spacing: 16.0,
                  runSpacing: 16.0,
                  children: [
                    EntitiyCountTile(
                      label: "local".tr(),
                      count: localAlbumCount,
                      icon: Icons.smartphone,
                    ),
                    EntitiyCountTile(
                      label: "remote".tr(),
                      count: remoteAlbumCount,
                      icon: Icons.cloud,
                    ),
                  ],
                ),
              ),
              SettingsSubTitle(title: "other".tr()),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Wrap(
                  spacing: 16.0,
                  runSpacing: 16.0,
                  children: [
                    EntitiyCountTile(
                      label: "memories".tr(),
                      count: memoryCount,
                      icon: Icons.calendar_today,
                    ),
                    EntitiyCountTile(
                      label: "hashed_assets".tr(),
                      count: localHashedCount,
                      icon: Icons.tag,
                    ),
                  ],
                ),
              ),
              SettingsSubTitle(title: "jobs".tr()),
              ListTile(
                title: Text("sync_local".tr()),
                leading: const Icon(Icons.sync),
                trailing: Text(
                  ref.watch(syncStatusProvider).localSyncStatus.localized(),
                ),
                onTap: () {
                  ref.read(backgroundSyncProvider).syncLocal(full: true);
                },
              ),
              ListTile(
                title: Text("sync_remote".tr()),
                leading: const Icon(Icons.cloud_sync),
                trailing: Text(
                  ref.watch(syncStatusProvider).remoteSyncStatus.localized(),
                ),
                onTap: () {
                  ref.read(backgroundSyncProvider).syncRemote();
                },
              ),
              ListTile(
                title: Text("hashing".tr()),
                leading: const Icon(Icons.tag),
                trailing: Text(
                  ref.watch(syncStatusProvider).hashJobStatus.localized(),
                ),
                onTap: () {
                  ref.read(backgroundSyncProvider).hashAssets();
                },
              ),
              SettingsSubTitle(title: "actions".tr()),
              ListTile(
                title: Text("reset_sqlite".tr()),
                leading: const Icon(Icons.storage),
                onTap: () async {
                  final drift = ref.read(driftProvider);
                  // ignore: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
                  final migrator = drift.createMigrator();
                  for (final entity in drift.allSchemaEntities) {
                    await migrator.drop(entity);
                    await migrator.create(entity);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
