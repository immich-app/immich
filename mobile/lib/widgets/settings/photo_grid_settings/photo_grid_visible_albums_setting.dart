import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/routing/router.dart';

class VisibleAlbumsSettings extends HookConsumerWidget {
  const VisibleAlbumsSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      title: const Text('Visible albums'),
      subtitle:
          const Text('Select which local albums will be shown on the timeline'),
      onTap: () => context.pushRoute(const LocalAlbumPickerRoute()),
    );
  }
}
