import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';

@RoutePage()
class DriftPlaceDetailPage extends StatelessWidget {
  final String place;

  const DriftPlaceDetailPage({
    super.key,
    required this.place,
  });

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineService =
                ref.watch(timelineFactoryProvider).place(place);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          },
        ),
      ],
      child: Timeline(
        appBar: MesmerizingSliverAppBar(
          title: place,
          icon: Icons.location_on,
        ),
      ),
    );
  }
}
