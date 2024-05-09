import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/presentation/modules/home/pages/home.page.dart';
import 'package:immich_mobile/presentation/modules/library/pages/library.page.dart';
import 'package:immich_mobile/presentation/modules/search/pages/search.page.dart';
import 'package:immich_mobile/presentation/modules/settings/pages/settings.page.dart';
import 'package:immich_mobile/presentation/modules/sharing/pages/sharing.page.dart';
import 'package:immich_mobile/presentation/router/pages/tab_controller.page.dart';

part 'router.gr.dart';

@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends _$AppRouter {
  AppRouter();

  @override
  List<AutoRoute> get routes => [
        AutoRoute(page: TabControllerRoute.page, initial: true, children: [
          AutoRoute(page: HomeRoute.page),
          AutoRoute(page: SearchRoute.page),
          AutoRoute(page: SharingRoute.page),
          AutoRoute(page: LibraryRoute.page),
        ]),
        AutoRoute(page: SettingsRoute.page),
      ];
}
