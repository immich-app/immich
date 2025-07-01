import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

@RoutePage()
class RemoteTimelinePage extends StatelessWidget {
  final String albumId;

  const RemoteTimelinePage({super.key, required this.albumId});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineService = ref
                .watch(timelineFactoryProvider)
                .remoteAlbum(albumId: albumId);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          },
        ),
      ],
      child: const Timeline(),
    );
  }
}
