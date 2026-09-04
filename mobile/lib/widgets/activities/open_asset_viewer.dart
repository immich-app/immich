import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';

Future<void> openActivityAssetViewer(BuildContext context, WidgetRef ref, String assetId) async {
  final route = await ref.read(activityServiceProvider).buildAssetViewerRoute(assetId, ref);
  if (route != null && context.mounted) {
    await context.pushRoute(route);
  }
}
