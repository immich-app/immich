import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/presentation/modules/home/pages/home.page.dart';
import 'package:immich_mobile/presentation/modules/library/pages/library.page.dart';
import 'package:immich_mobile/presentation/modules/login/pages/login.page.dart';
import 'package:immich_mobile/presentation/modules/logs/pages/log.page.dart';
import 'package:immich_mobile/presentation/modules/search/pages/search.page.dart';
import 'package:immich_mobile/presentation/modules/settings/pages/about_settings.page.dart';
import 'package:immich_mobile/presentation/modules/settings/pages/advance_settings.page.dart';
import 'package:immich_mobile/presentation/modules/settings/pages/general_settings.page.dart';
import 'package:immich_mobile/presentation/modules/settings/pages/settings.page.dart';
import 'package:immich_mobile/presentation/modules/sharing/pages/sharing.page.dart';
import 'package:immich_mobile/presentation/router/pages/splash_screen.page.dart';
import 'package:immich_mobile/presentation/router/pages/tab_controller.page.dart';

part 'router.gr.dart';

@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends _$AppRouter implements AutoRouteGuard {
  AppRouter();

  @override
  List<AutoRoute> get routes => [
        AutoRoute(
          page: SplashScreenWrapperRoute.page,
          initial: true,
          children: [
            AutoRoute(page: SplashScreenRoute.page, initial: true),
            AutoRoute(page: LoginRoute.page),
          ],
        ),
        AutoRoute(page: LogsRoute.page),
        AutoRoute(page: TabControllerRoute.page, children: [
          AutoRoute(page: HomeRoute.page),
          AutoRoute(page: SearchRoute.page),
          AutoRoute(page: SharingRoute.page),
          AutoRoute(page: LibraryRoute.page),
        ]),
        AutoRoute(page: SettingsWrapperRoute.page, children: [
          AutoRoute(page: SettingsRoute.page),
          AutoRoute(page: GeneralSettingsRoute.page),
          AutoRoute(page: AboutSettingsRoute.page),
          AutoRoute(page: AdvanceSettingsRoute.page),
        ]),
      ];

  // Global guards
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) {
    // Prevent duplicates
    resolver.next(resolver.route.name != router.current.name);
  }
}
