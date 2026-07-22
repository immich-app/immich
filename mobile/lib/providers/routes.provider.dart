import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/routing/router.dart';

@visibleForTesting
bool isRouteInStack(Ref ref, String routeName) {
  final router = ref.watch(appRouterProvider);
  void onChange() => ref.invalidateSelf();
  router.addListener(onChange);
  ref.onDispose(() => router.removeListener(onChange));
  return router.stackData.any((route) => route.name == routeName);
}

final inLockedViewProvider = Provider<bool>((ref) => isRouteInStack(ref, DriftLockedFolderRoute.name));
final isAssetViewerOpenProvider = Provider<bool>((ref) => isRouteInStack(ref, AssetViewerRoute.name));

final currentRouteNameProvider = StateProvider<String?>((ref) => null);
final previousRouteNameProvider = StateProvider<String?>((ref) => null);
final previousRouteDataProvider = StateProvider<RouteSettings?>((ref) => null);
