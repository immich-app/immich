import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';

@RoutePage()
class GuestGalleryPage extends StatelessWidget {
  const GuestGalleryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [timelineServiceProvider.overrideWith((ref) => ref.watch(localOnlyTimelineServiceProvider))],
      child: Timeline(
        appBar: SliverAppBar(
          title: const Text('On this device'),
          floating: true,
          actions: [
            TextButton.icon(
              onPressed: () => context.replaceRoute(const LoginRoute()),
              icon: const Icon(Icons.login),
              label: const Text('Sign in'),
            ),
          ],
        ),
        showStorageIndicator: false,
      ),
    );
  }
}
