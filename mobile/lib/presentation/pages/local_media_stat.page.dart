import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final _stats = [
  _Stat(
    name: 'Local Assets',
    load: (db) => db.managers.localAssetEntity.count(),
  ),
  _Stat(
    name: 'Local Albums',
    load: (db) => db.managers.localAlbumEntity.count(),
  ),
];

@RoutePage()
class LocalMediaSummaryPage extends StatelessWidget {
  const LocalMediaSummaryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Local Media Summary')),
      body: Consumer(
        builder: (ctx, ref, __) {
          final db = ref.watch(driftProvider);
          final albumsFuture = ref.watch(localAlbumRepository).getAll();

          return CustomScrollView(
            slivers: [
              SliverList.builder(
                itemBuilder: (_, index) {
                  final stat = _stats[index];
                  final countFuture = stat.load(db);
                  return _Summary(name: stat.name, countFuture: countFuture);
                },
                itemCount: _stats.length,
              ),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Divider(),
                    Padding(
                      padding: const EdgeInsets.only(left: 15),
                      child: Text(
                        "Album summary",
                        style: ctx.textTheme.titleMedium,
                      ),
                    ),
                  ],
                ),
              ),
              FutureBuilder(
                future: albumsFuture,
                initialData: <LocalAlbum>[],
                builder: (_, snap) {
                  final albums = snap.data!;
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
                        name: album.name,
                        countFuture: countFuture,
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

// ignore: prefer-single-widget-per-file
class _Summary extends StatelessWidget {
  final String name;
  final Future<int> countFuture;

  const _Summary({required this.name, required this.countFuture});

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
          subtitle = Text('${snapshot.data ?? 0}');
        }
        return ListTile(title: Text(name), trailing: subtitle);
      },
    );
  }
}

class _Stat {
  const _Stat({required this.name, required this.load});

  final String name;
  final Future<int> Function(Drift _) load;
}
