import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class _Stat {
  const _Stat({required this.name, required this.load});

  final String name;
  final Future<int> Function(Drift _) load;
}

class _Summary extends StatelessWidget {
  final String name;
  final Widget? leading;
  final Future<int> countFuture;
  final void Function()? onTap;

  const _Summary({required this.name, required this.countFuture, this.leading, this.onTap});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<int>(
      future: countFuture,
      builder: (ctx, snapshot) {
        final Widget subtitle;

        if (snapshot.connectionState == ConnectionState.waiting) {
          subtitle = const CircularProgressIndicator();
        } else if (snapshot.hasError) {
          subtitle = const Icon(Icons.error_rounded);
        } else {
          subtitle = Text('${snapshot.data ?? 0}', style: ctx.textTheme.bodyLarge);
        }
        return ListTile(leading: leading, title: Text(name), trailing: subtitle, onTap: onTap);
      },
    );
  }
}

final _localStats = [
  _Stat(name: 'Local Assets', load: (db) => db.managers.localAssetEntity.count()),
  _Stat(name: 'Local Albums', load: (db) => db.managers.localAlbumEntity.count()),
];

@RoutePage()
class LocalMediaSummaryPage extends StatelessWidget {
  const LocalMediaSummaryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('local_media_summary'.tr())),
      body: Consumer(
        builder: (ctx, ref, __) {
          final db = ref.watch(driftProvider);
          final albumsFuture = ref.watch(localAlbumRepository).getAll();

          return CustomScrollView(
            slivers: [
              SliverList.builder(
                itemBuilder: (_, index) {
                  final stat = _localStats[index];
                  final countFuture = stat.load(db);
                  return _Summary(name: stat.name, countFuture: countFuture);
                },
                itemCount: _localStats.length,
              ),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Divider(),
                    Padding(
                      padding: const EdgeInsets.only(left: 15),
                      child: Text("album_summary".tr(), style: ctx.textTheme.titleMedium),
                    ),
                  ],
                ),
              ),
              FutureBuilder(
                future: albumsFuture,
                builder: (_, snap) {
                  final albums = snap.data ?? [];
                  if (albums.isEmpty) {
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }

                  albums.sortBy((a) => a.name);
                  return SliverList.builder(
                    itemBuilder: (_, index) {
                      final album = albums[index];
                      final countFuture = db.managers.localAlbumAssetEntity
                          .filter((f) => f.albumId.id.equals(album.id))
                          .count();
                      return _Summary(
                        leading: const Icon(Icons.photo_album_rounded),
                        name: album.name,
                        countFuture: countFuture,
                        onTap: () => context.router.push(LocalTimelineRoute(album: album)),
                      );
                    },
                    itemCount: albums.length,
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

final _remoteStats = [
  _Stat(name: 'Remote Assets', load: (db) => db.managers.remoteAssetEntity.count()),
  _Stat(name: 'Exif Entities', load: (db) => db.managers.remoteExifEntity.count()),
  _Stat(name: 'Remote Albums', load: (db) => db.managers.remoteAlbumEntity.count()),
  _Stat(name: 'Memories', load: (db) => db.managers.memoryEntity.count()),
  _Stat(name: 'Memories Assets', load: (db) => db.managers.memoryAssetEntity.count()),
  _Stat(name: 'Stacks', load: (db) => db.managers.stackEntity.count()),
  _Stat(name: 'People', load: (db) => db.managers.personEntity.count()),
  _Stat(name: 'AssetFaces', load: (db) => db.managers.assetFaceEntity.count()),
];

@RoutePage()
class RemoteMediaSummaryPage extends StatelessWidget {
  const RemoteMediaSummaryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('remote_media_summary'.tr())),
      body: Consumer(
        builder: (ctx, ref, __) {
          final db = ref.watch(driftProvider);
          final albumsFuture = ref.watch(remoteAlbumRepository).getAll();

          return CustomScrollView(
            slivers: [
              SliverList.builder(
                itemBuilder: (_, index) {
                  final stat = _remoteStats[index];
                  final countFuture = stat.load(db);
                  return _Summary(name: stat.name, countFuture: countFuture);
                },
                itemCount: _remoteStats.length,
              ),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Divider(),
                    Padding(
                      padding: const EdgeInsets.only(left: 15),
                      child: Text("album_summary".tr(), style: ctx.textTheme.titleMedium),
                    ),
                  ],
                ),
              ),
              FutureBuilder(
                future: albumsFuture,
                builder: (_, snap) {
                  final albums = snap.data ?? [];
                  if (albums.isEmpty) {
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }

                  albums.sortBy((a) => a.name);
                  return SliverList.builder(
                    itemBuilder: (_, index) {
                      final album = albums[index];
                      final countFuture = db.managers.remoteAlbumAssetEntity
                          .filter((f) => f.albumId.id.equals(album.id))
                          .count();
                      return _Summary(
                        leading: const Icon(Icons.photo_album_rounded),
                        name: album.name,
                        countFuture: countFuture,
                        onTap: () => context.router.push(RemoteAlbumRoute(album: album)),
                      );
                    },
                    itemCount: albums.length,
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
