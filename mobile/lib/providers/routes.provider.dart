import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/routing/router.dart';

@visibleForTesting
bool isRouteInStack(Ref ref, String routeName) {
  final router = ref.watch(appRouterProvider);
  return router.stackData.any((route) => route.name == routeName);
}

final inLockedViewProvider = Provider<bool>((ref) => isRouteInStack(ref, LockedFolderRoute.name));
final isAssetViewerOpenProvider = Provider<bool>((ref) => isRouteInStack(ref, AssetViewerRoute.name));
final timelinePersonProvider = Provider.autoDispose<Person?>((ref) {
  final router = ref.watch(appRouterProvider);
  for (final route in router.stackData.reversed) {
    final args = route.args;
    if (args is PersonRouteArgs) {
      return args.person;
    }
  }

  return null;
});

final currentRouteNameProvider = StateProvider<String?>((ref) => null);
final previousRouteNameProvider = StateProvider<String?>((ref) => null);
final previousRouteDataProvider = StateProvider<RouteSettings?>((ref) => null);
