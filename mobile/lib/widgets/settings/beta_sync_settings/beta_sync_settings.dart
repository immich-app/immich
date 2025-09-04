import 'dart:io';

import 'package:drift/drift.dart' as drift_db;
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/widgets/settings/beta_sync_settings/entity_count_tile.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class BetaSyncSettings extends HookConsumerWidget {
  const BetaSyncSettings({super.key});

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

      return await Future.wait([assetCounts, localAlbumCounts, remoteAlbumCounts, memoryCount, getLocalHashedCount]);
    }

    Future<void> resetDatabase() async {
      // https://github.com/simolus3/drift/commit/bd80a46264b6dd833ef4fd87fffc03f5a832ab41#diff-3f879e03b4a35779344ef16170b9353608dd9c42385f5402ec6035aac4dd8a04R76-R94
      final drift = ref.read(driftProvider);
      final database = drift.attachedDatabase;
      await database.exclusively(() async {
        // https://stackoverflow.com/a/65743498/25690041
        await database.customStatement('PRAGMA writable_schema = 1;');
        await database.customStatement('DELETE FROM sqlite_master;');
        await database.customStatement('VACUUM;');
        await database.customStatement('PRAGMA writable_schema = 0;');
        await database.customStatement('PRAGMA integrity_check');

        await database.customStatement('PRAGMA user_version = 0');
        await database.beforeOpen(
          // ignore: invalid_use_of_internal_member
          database.resolvedEngine.executor,
          drift_db.OpeningDetails(null, database.schemaVersion),
        );
        await database.customStatement('PRAGMA user_version = ${database.schemaVersion}');

        // Refresh all stream queries
        database.notifyUpdates({for (final table in database.allTables) drift_db.TableUpdate.onTable(table)});
      });
    }

    Future<void> exportDatabase() async {
      try {
        // WAL Checkpoint to ensure all changes are written to the database
        await ref.read(driftProvider).customStatement("pragma wal_checkpoint(truncate)");
        final documentsDir = await getApplicationDocumentsDirectory();
        final dbFile = File(path.join(documentsDir.path, 'immich.sqlite'));

        if (!await dbFile.exists()) {
          if (context.mounted) {
            context.scaffoldMessenger.showSnackBar(
              SnackBar(content: Text("Database file not found".t(context: context))),
            );
          }
          return;
        }

        final timestamp = DateTime.now().millisecondsSinceEpoch;
        final exportFile = File(path.join(documentsDir.path, 'immich_export_$timestamp.sqlite'));

        await dbFile.copy(exportFile.path);

        await Share.shareXFiles([XFile(exportFile.path)], text: 'Immich Database Export');

        Future.delayed(const Duration(seconds: 30), () async {
          if (await exportFile.exists()) {
            await exportFile.delete();
          }
        });

        if (context.mounted) {
          context.scaffoldMessenger.showSnackBar(
            SnackBar(content: Text("Database exported successfully".t(context: context))),
          );
        }
      } catch (e) {
        if (context.mounted) {
          context.scaffoldMessenger.showSnackBar(
            SnackBar(content: Text("Failed to export database: $e".t(context: context))),
          );
        }
      }
    }

    Future<void> clearFileCache() async {
      await ref.read(storageRepositoryProvider).clearCache();
    }

    Future<void> resetSqliteDb(BuildContext context, Future<void> Function() resetDatabase) {
      return showDialog(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: Text("reset_sqlite".t(context: context)),
            content: Text("reset_sqlite_confirmation".t(context: context)),
            actions: [
              TextButton(
                onPressed: () => context.pop(),
                child: Text("cancel".t(context: context)),
              ),
              TextButton(
                onPressed: () async {
                  await resetDatabase();
                  context.pop();
                  context.scaffoldMessenger.showSnackBar(
                    SnackBar(content: Text("reset_sqlite_success".t(context: context))),
                  );
                },
                child: Text(
                  "confirm".t(context: context),
                  style: TextStyle(color: context.colorScheme.error),
                ),
              ),
            ],
          );
        },
      );
    }

    return FutureBuilder<List<dynamic>>(
      future: loadCounts(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const CircularProgressIndicator();
        }

        if (snapshot.hasError) {
          return ListView(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Center(
                  child: Text(
                    "Error occur, reset the local database by tapping the button below",
                    style: context.textTheme.bodyLarge,
                  ),
                ),
              ),

              ListTile(
                title: Text(
                  "reset_sqlite".t(context: context),
                  style: TextStyle(color: context.colorScheme.error, fontWeight: FontWeight.w500),
                ),
                leading: Icon(Icons.settings_backup_restore_rounded, color: context.colorScheme.error),
                onTap: () async {
                  await resetSqliteDb(context, resetDatabase);
                },
              ),
            ],
          );
        }

        final assetCounts = snapshot.data![0]! as (int, int);
        final localAssetCount = assetCounts.$1;
        final remoteAssetCount = assetCounts.$2;

        final localAlbumCount = snapshot.data![1]! as int;
        final remoteAlbumCount = snapshot.data![2]! as int;
        final memoryCount = snapshot.data![3]! as int;
        final localHashedCount = snapshot.data![4]! as int;

        return Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 32),
          child: ListView(
            children: [
              _SectionHeaderText(text: "assets".t(context: context)),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Flex(
                  direction: Axis.horizontal,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  spacing: 8.0,
                  children: [
                    Expanded(
                      child: EntitiyCountTile(
                        label: "local".t(context: context),
                        count: localAssetCount,
                        icon: Icons.smartphone,
                      ),
                    ),
                    Expanded(
                      child: EntitiyCountTile(
                        label: "remote".t(context: context),
                        count: remoteAssetCount,
                        icon: Icons.cloud,
                      ),
                    ),
                  ],
                ),
              ),
              _SectionHeaderText(text: "albums".t(context: context)),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Flex(
                  direction: Axis.horizontal,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  spacing: 8.0,
                  children: [
                    Expanded(
                      child: EntitiyCountTile(
                        label: "local".t(context: context),
                        count: localAlbumCount,
                        icon: Icons.smartphone,
                      ),
                    ),
                    Expanded(
                      child: EntitiyCountTile(
                        label: "remote".t(context: context),
                        count: remoteAlbumCount,
                        icon: Icons.cloud,
                      ),
                    ),
                  ],
                ),
              ),
              _SectionHeaderText(text: "other".t(context: context)),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Flex(
                  direction: Axis.horizontal,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  spacing: 8.0,
                  children: [
                    Expanded(
                      child: EntitiyCountTile(
                        label: "memories".t(context: context),
                        count: memoryCount,
                        icon: Icons.calendar_today,
                      ),
                    ),
                    Expanded(
                      child: EntitiyCountTile(
                        label: "hashed_assets".t(context: context),
                        count: localHashedCount,
                        icon: Icons.tag,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, indent: 16, endIndent: 16),
              const SizedBox(height: 24),
              _SectionHeaderText(text: "jobs".t(context: context)),
              ListTile(
                title: Text(
                  "sync_local".t(context: context),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text("tap_to_run_job".t(context: context)),
                leading: const Icon(Icons.sync),
                trailing: _SyncStatusIcon(status: ref.watch(syncStatusProvider).localSyncStatus),
                onTap: () {
                  ref.read(backgroundSyncProvider).syncLocal(full: true);
                },
              ),
              ListTile(
                title: Text(
                  "sync_remote".t(context: context),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text("tap_to_run_job".t(context: context)),
                leading: const Icon(Icons.cloud_sync),
                trailing: _SyncStatusIcon(status: ref.watch(syncStatusProvider).remoteSyncStatus),
                onTap: () {
                  ref.read(backgroundSyncProvider).syncRemote();
                },
              ),
              ListTile(
                title: Text(
                  "hash_asset".t(context: context),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                leading: const Icon(Icons.tag),
                subtitle: Text("tap_to_run_job".t(context: context)),
                trailing: _SyncStatusIcon(status: ref.watch(syncStatusProvider).hashJobStatus),
                onTap: () {
                  ref.read(backgroundSyncProvider).hashAssets();
                },
              ),
              const Divider(height: 1, indent: 16, endIndent: 16),
              const SizedBox(height: 24),
              _SectionHeaderText(text: "actions".t(context: context)),
              ListTile(
                title: Text(
                  "clear_file_cache".t(context: context),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                leading: const Icon(Icons.playlist_remove_rounded),
                onTap: clearFileCache,
              ),
              ListTile(
                title: Text(
                  "export_database".t(context: context),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text("export_database_description".t(context: context)),
                leading: const Icon(Icons.download),
                onTap: exportDatabase,
              ),
              ListTile(
                title: Text(
                  "reset_sqlite".t(context: context),
                  style: TextStyle(color: context.colorScheme.error, fontWeight: FontWeight.w500),
                ),
                leading: Icon(Icons.settings_backup_restore_rounded, color: context.colorScheme.error),
                onTap: () async {
                  await resetSqliteDb(context, resetDatabase);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SyncStatusIcon extends StatelessWidget {
  final SyncStatus status;

  const _SyncStatusIcon({required this.status});

  @override
  Widget build(BuildContext context) {
    return switch (status) {
      SyncStatus.idle => const Icon(Icons.pause_circle_outline_rounded),
      SyncStatus.syncing => const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)),
      SyncStatus.success => const Icon(Icons.check_circle_outline, color: Colors.green),
      SyncStatus.error => Icon(Icons.error_outline, color: context.colorScheme.error),
    };
  }
}

class _SectionHeaderText extends StatelessWidget {
  final String text;

  const _SectionHeaderText({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16.0),
      child: Text(
        text.toUpperCase(),
        style: context.textTheme.labelLarge?.copyWith(
          fontWeight: FontWeight.w500,
          color: context.colorScheme.onSurface.withAlpha(200),
        ),
      ),
    );
  }
}
