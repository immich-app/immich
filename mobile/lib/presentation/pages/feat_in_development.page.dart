import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';

final _features = [
  _Features(
    name: 'Sync Local',
    icon: Icons.photo_album_rounded,
    onTap: (ref) => ref.read(backgroundSyncProvider).syncLocal(),
  ),
  _Features(
    name: 'Sync Remote',
    icon: Icons.refresh_rounded,
    onTap: (ref) => ref.read(backgroundSyncProvider).syncRemote(),
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
              onTap: () => unawaited(feat.onTap(ref)),
            ),
          );
        },
        itemCount: _features.length,
      ),
    );
  }
}

class _Features {
  const _Features({
    required this.name,
    required this.icon,
    required this.onTap,
  });

  final String name;
  final IconData icon;
  final Future<void> Function(WidgetRef _) onTap;
}
