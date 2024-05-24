import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/presentation/components/image/immich_logo.widget.dart';
import 'package:immich_mobile/presentation/modules/login/states/login_page.state.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

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
    with SingleTickerProviderStateMixin, LogContext {
  late final AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 30),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder(
        future: di.allReady(),
        builder: (_, snap) {
          if (snap.hasData) {
            context.replaceRoute(const LoginRoute());
          } else if (snap.hasError) {
            log.severe(
              "Error while initializing the app",
              snap.error,
              snap.stackTrace,
            );
          }

          return Center(
            child: RotationTransition(
              turns: _animationController,
              child: const ImLogo(width: 100),
            ),
          );
        },
      ),
    );
  }
}
