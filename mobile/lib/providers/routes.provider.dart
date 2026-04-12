import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final inLockedViewProvider = StateProvider<bool>((ref) => false);
final currentRouteNameProvider = StateProvider<String?>((ref) => null);
final previousRouteNameProvider = StateProvider<String?>((ref) => null);
final previousRouteDataProvider = StateProvider<RouteSettings?>((ref) => null);

/// Stores a deep link URI that arrived during cold start, before the app was
/// fully initialized. The splash screen checks this after auth/sync setup and
/// navigates to the deep link target once the API connection is ready.
final pendingDeepLinkProvider = StateProvider<Uri?>((ref) => null);
