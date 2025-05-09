import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/routing/router.dart';

final _features = [
  _Feature(
    name: 'Sync Local',
    icon: Icons.photo_album_rounded,
    onTap: (_, ref) => ref.read(backgroundSyncProvider).syncLocal(),
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
    name: 'Local Media Summary',
    icon: Icons.table_chart_rounded,
    onTap: (ctx, _) => ctx.pushRoute(const LocalMediaSummaryRoute()),
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
      body: ListView.builder(
        itemBuilder: (_, index) {
          final feat = _features[index];
          return Consumer(
            builder: (ctx, ref, _) => ListTile(
              title: Text(feat.name),
              trailing: Icon(feat.icon),
              onTap: () => unawaited(feat.onTap(ctx, ref)),
            ),
          );
        },
        itemCount: _features.length,
      ),
    );
  }
}

class _Feature {
  const _Feature({
    required this.name,
    required this.icon,
    required this.onTap,
  });

  final String name;
  final IconData icon;
  final Future<void> Function(BuildContext, WidgetRef _) onTap;
}
