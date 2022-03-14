import 'package:auto_route/auto_route.dart';

class TabNavigationObserver extends AutoRouterObserver {
  @override
  void didInitTabRoute(TabPageRoute route, TabPageRoute? previousRoute) {
    // Perform tasks on first navigation to SearchRoute
    if (route.name == 'SearchRoute') {
      // final container = ProviderContainer();
      // container.read(searchPageStateProvider.notifier).getSuggestedSearchTerms();
    }
  }

  @override
  Future<void> didChangeTabRoute(TabPageRoute route, TabPageRoute previousRoute) async {
    // Perform tasks on re-visit to SearchRoute
    if (route.name == 'SearchRoute') {
      // final container = ProviderContainer();
      // container.read(searchPageStateProvider.notifier).getSuggestedSearchTerms();
    }
  }
}
