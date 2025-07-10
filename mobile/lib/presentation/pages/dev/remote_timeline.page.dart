import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';

@RoutePage()
class RemoteTimelinePage extends StatelessWidget {
  final RemoteAlbum album;

  const RemoteTimelinePage({super.key, required this.album});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineService = ref
                .watch(timelineFactoryProvider)
                .remoteAlbum(albumId: album.id);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          },
        ),
      ],
      child: Timeline(
        appBar: MesmerizingSliverAppBar(
          title: album.name,
          icon: Icons.photo_album_outlined,
        ),
      ),
    );
  }
}
