import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:drift/drift.dart' hide Column;
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/pages/dev/dev_logger.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/routing/router.dart';

final _features = [
  _Feature(
    name: 'Sync Local',
    icon: Icons.photo_album_rounded,
    onTap: (_, ref) => ref.read(backgroundSyncProvider).syncLocal(),
  ),
  _Feature(
    name: 'Sync Local Full',
    icon: Icons.photo_library_rounded,
    onTap: (_, ref) => ref.read(backgroundSyncProvider).syncLocal(full: true),
  ),
  _Feature(
    name: 'Hash Local Assets',
    icon: Icons.numbers_outlined,
    onTap: (_, ref) => ref.read(backgroundSyncProvider).hashAssets(),
  ),
  _Feature(
    name: 'Sync Remote',
    icon: Icons.refresh_rounded,
    onTap: (_, ref) => ref.read(backgroundSyncProvider).syncRemote(),
  ),
  _Feature(
    name: 'WAL Checkpoint',
    icon: Icons.save_rounded,
    onTap: (_, ref) => ref
        .read(driftProvider)
        .customStatement("pragma wal_checkpoint(truncate)"),
  ),
  _Feature(
    name: 'Clear Delta Checkpoint',
    icon: Icons.delete_rounded,
    onTap: (_, ref) => ref.read(nativeSyncApiProvider).clearSyncCheckpoint(),
  ),
  _Feature(
    name: 'Clear Local Data',
    style: const TextStyle(
      color: Colors.orange,
      fontWeight: FontWeight.bold,
    ),
    icon: Icons.delete_forever_rounded,
    onTap: (_, ref) async {
      final db = ref.read(driftProvider);
      await db.localAssetEntity.deleteAll();
      await db.localAlbumEntity.deleteAll();
      await db.localAlbumAssetEntity.deleteAll();
    },
  ),
  _Feature(
    name: 'Clear Remote Data',
    style: const TextStyle(
      color: Colors.orange,
      fontWeight: FontWeight.bold,
    ),
    icon: Icons.delete_sweep_rounded,
    onTap: (_, ref) async {
      final db = ref.read(driftProvider);
      await db.remoteAssetEntity.deleteAll();
      await db.remoteExifEntity.deleteAll();
    },
  ),
  _Feature(
    name: 'Local Media Summary',
    style: const TextStyle(
      color: Colors.indigo,
      fontWeight: FontWeight.bold,
    ),
    icon: Icons.table_chart_rounded,
    onTap: (ctx, _) => ctx.pushRoute(const LocalMediaSummaryRoute()),
  ),
  _Feature(
    name: 'Remote Media Summary',
    style: const TextStyle(
      color: Colors.indigo,
      fontWeight: FontWeight.bold,
    ),
    icon: Icons.summarize_rounded,
    onTap: (ctx, _) => ctx.pushRoute(const RemoteMediaSummaryRoute()),
  ),
  _Feature(
    name: 'Reset Sqlite',
    icon: Icons.table_view_rounded,
    style: const TextStyle(
      color: Colors.red,
      fontWeight: FontWeight.bold,
    ),
    onTap: (_, ref) async {
      final drift = ref.read(driftProvider);
      // ignore: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
      final migrator = drift.createMigrator();
      for (final entity in drift.allSchemaEntities) {
        await migrator.drop(entity);
        await migrator.create(entity);
      }
    },
  ),
  _Feature(
    name: 'Main Timeline',
    icon: Icons.timeline_rounded,
    onTap: (ctx, _) => ctx.pushRoute(const MainTimelineRoute()),
  ),
];

@RoutePage()
class FeatInDevPage extends StatelessWidget {
  const FeatInDevPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Features in Development'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Flexible(
            flex: 1,
            child: ListView.builder(
              itemBuilder: (_, index) {
                final feat = _features[index];
                return Consumer(
                  builder: (ctx, ref, _) => ListTile(
                    title: Text(
                      feat.name,
                      style: feat.style,
                    ),
                    trailing: Icon(feat.icon),
                    visualDensity: VisualDensity.compact,
                    onTap: () => unawaited(feat.onTap(ctx, ref)),
                  ),
                );
              },
              itemCount: _features.length,
            ),
          ),
          const Divider(height: 0),
          const Flexible(child: _DevLogs()),
        ],
      ),
    );
  }
}

class _Feature {
  const _Feature({
    required this.name,
    required this.icon,
    required this.onTap,
    // ignore: unused_element_parameter
    this.style,
  });

  final String name;
  final IconData icon;
  final TextStyle? style;
  final Future<void> Function(BuildContext, WidgetRef _) onTap;
}

class _DevLogs extends StatelessWidget {
  const _DevLogs();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: DLog.clearLog,
            icon: Icon(
              Icons.delete_outline_rounded,
              size: 20.0,
              color: context.primaryColor,
              semanticLabel: "Clear logs",
            ),
          ),
        ],
        centerTitle: true,
      ),
      body: StreamBuilder(
        initialData: [],
        stream: DLog.watchLog(),
        builder: (_, logMessages) {
          return ListView.separated(
            itemBuilder: (ctx, index) {
              final logMessage = logMessages.data![index];
              return ListTile(
                title: Text(
                  logMessage.message,
                  style: TextStyle(
                    color: ctx.colorScheme.onSurface,
                    fontSize: 14.0,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                subtitle: Text(
                  "at ${DateFormat("HH:mm:ss.SSS").format(logMessage.createdAt)}",
                  style: TextStyle(
                    color: ctx.colorScheme.onSurfaceSecondary,
                    fontSize: 12.0,
                  ),
                ),
                dense: true,
                visualDensity: VisualDensity.compact,
                tileColor: Colors.transparent,
                minLeadingWidth: 10,
              );
            },
            separatorBuilder: (_, index) {
              return const Divider(height: 0);
            },
            itemCount: logMessages.data?.length ?? 0,
          );
        },
      ),
    );
  }
}
