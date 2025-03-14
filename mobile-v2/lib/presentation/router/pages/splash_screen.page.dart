import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/presentation/components/image/immich_logo.widget.dart';
import 'package:immich_mobile/presentation/modules/login/states/login_page.state.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/states/gallery_permission.state.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

@RoutePage()
class SplashScreenWrapperPage extends AutoRouter implements AutoRouteWrapper {
  const SplashScreenWrapperPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) {
    return BlocProvider(create: (_) => LoginPageCubit(), child: this);
  }
}

@RoutePage()
class SplashScreenPage extends StatefulWidget {
  const SplashScreenPage({super.key});

  @override
  State createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreenPage>
    with SingleTickerProviderStateMixin, LogMixin {
  late final AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 30),
      vsync: this,
    )..repeat();
    unawaited(di<GalleryPermissionProvider>().requestPermission());
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _tryLogin() async {
    if (await di<LoginService>().tryAutoLogin() && mounted) {
      unawaited(context.replaceRoute(const TabControllerRoute()));
    } else if (mounted) {
      unawaited(context.replaceRoute(const LoginRoute()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder(
        future: di.allReady(),
        builder: (_, snap) {
          if (snap.hasData) {
            unawaited(_tryLogin());
          } else if (snap.hasError) {
            log.wtf(
              "Error while initializing the app",
              snap.error,
              snap.stackTrace,
            );
          }

          return Center(
            child: RotationTransition(
              turns: _animationController,
              child: const ImLogo(dimension: 100),
            ),
          );
        },
      ),
    );
  }
}
